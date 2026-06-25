import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { AuthService } from '../auth/auth.service';
import { ChatSession } from './entities/chat-session.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private firebaseAdminService: FirebaseAdminService,
    private authService: AuthService,
    @InjectRepository(ChatSession, 'chatConnection')
    private chatSessionRepository: Repository<ChatSession>,
  ) {}

  async getChatToken(
    authHeader?: string,
    query?: { email?: string; orderCode?: string },
  ): Promise<{ token: string; uid: string; claims: any }> {
    // 1. Check if user is logged in (Member/Admin) using Beverage JWT
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verifyResult = await this.authService.verifyToken(token);

      if (verifyResult.valid && verifyResult.userId) {
        const claims = {
          role: verifyResult.role || 'member',
          name: verifyResult.fullName || verifyResult.email || 'Member',
          email: verifyResult.email,
        };

        const customToken = await this.firebaseAdminService.createCustomToken(
          verifyResult.userId,
          claims,
        );

        this.logger.log(`Generated Firebase custom token for Member: ${verifyResult.userId}`);
        return { token: customToken, uid: verifyResult.userId, claims };
      }
    }

    // 2. Fallback: Authenticate as Guest using Email
    if (query?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(query.email)) {
        // Sanitize email to build a valid Firebase UID (alphanumeric and underscore)
        const cleanEmailUid = query.email.replace(/[^a-zA-Z0-9]/g, '_');
        const uid = `guest_${cleanEmailUid}`;

        const claims = {
          role: 'guest',
          email: query.email,
          name: `Guest (${query.email})`,
        };

        const customToken = await this.firebaseAdminService.createCustomToken(
          uid,
          claims,
        );

        this.logger.log(`Generated Firebase custom token for Guest Email: ${query.email}`);
        return { token: customToken, uid, claims };
      } else {
        throw new UnauthorizedException('Định dạng email khách vãng lai không hợp lệ');
      }
    }

    // 3. Fallback: Authenticate as Guest using Order Code
    if (query?.orderCode) {
      const cleanOrderUid = query.orderCode.replace(/[^a-zA-Z0-9]/g, '_');
      const uid = `guest_${cleanOrderUid}`;

      const claims = {
        role: 'guest',
        orderCode: query.orderCode,
        name: `Guest Order (${query.orderCode})`,
      };

      const customToken = await this.firebaseAdminService.createCustomToken(
        uid,
        claims,
      );

      this.logger.log(`Generated Firebase custom token for Guest Order: ${query.orderCode}`);
      return { token: customToken, uid, claims };
    }

    throw new UnauthorizedException(
      'Không thể xác thực danh tính để vào Chat. Vui lòng đăng nhập hoặc cung cấp Email khách vãng lai.',
    );
  }

  async archiveChatRoom(
    roomId: string,
    adminId: string,
    adminName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const db = this.firebaseAdminService.getFirestore();

      // 1. Read the chatRoom document
      const roomRef = db.collection('chatRooms').doc(roomId);
      const roomSnap = await roomRef.get();

      if (!roomSnap.exists) {
        throw new Error('Phòng chat không tồn tại trên Firestore.');
      }

      const roomData = roomSnap.data();

      // 2. Read all messages subcollection sorted by createdAt
      const messagesSnap = await roomRef
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      const messagesList = [];
      messagesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        messagesList.push({
          id: docSnap.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          isSeen: data.isSeen ?? false,
        });
      });

      // 3. Save to PostgreSQL chat_db
      let chatSession = await this.chatSessionRepository.findOne({ where: { id: roomId } });
      if (!chatSession) {
        chatSession = new ChatSession();
        chatSession.id = roomId;
        chatSession.customerId = roomData.customerId;
        chatSession.customerName = roomData.customerName;
        chatSession.customerEmail = roomData.customerEmail || null;
      }

      chatSession.assignedAdminId = adminId;
      chatSession.assignedAdminName = adminName;
      chatSession.closedAt = new Date();
      chatSession.messages = messagesList;

      await this.chatSessionRepository.save(chatSession);

      // 4. Update status = 'closed' and closedAt on Firestore (No delete - grace period of 7 days)
      await roomRef.update({
        status: 'closed',
        closedAt: new Date(),
        assignedTo: adminId,
        assignedName: adminName,
      });

      this.logger.log(`Archived chat room ${roomId} to Postgres successfully.`);
      return { success: true, message: 'Đóng cuộc trò chuyện và lưu trữ lịch sử thành công.' };
    } catch (error) {
      this.logger.error(`Failed to archive chat room ${roomId}: ${error.message}`);
      throw error;
    }
  }

  async getChatHistoryFromPostgres(roomId: string): Promise<any> {
    try {
      const session = await this.chatSessionRepository.findOne({ where: { id: roomId } });
      if (!session) {
        return { messages: [] };
      }
      return {
        id: session.id,
        customerId: session.customerId,
        customerName: session.customerName,
        customerEmail: session.customerEmail,
        assignedAdminId: session.assignedAdminId,
        assignedAdminName: session.assignedAdminName,
        startedAt: session.startedAt,
        closedAt: session.closedAt,
        messages: session.messages || [],
      };
    } catch (error) {
      this.logger.error(`Failed to load chat history for room ${roomId}: ${error.message}`);
      throw error;
    }
  }
}

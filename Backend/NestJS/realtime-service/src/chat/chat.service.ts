import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private firebaseAdminService: FirebaseAdminService,
    private authService: AuthService,
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
}

import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, List, Avatar, Input, Button, Badge, Spin, Typography } from 'antd';
import { SendOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { apiClient } from '../../lib/api';
import { auth, db } from '../../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

const { Text } = Typography;

interface ChatRoom {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  members: string[];
  typingStatus?: Record<string, boolean>;
}

interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isSeen: boolean;
}

const ChatWindow: React.FC = () => {
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminTypingTimeoutRef = useRef<any>(null);

  // 1. Authenticate with Firebase on component mount
  useEffect(() => {
    const loginFirebaseAdmin = async () => {
      try {
        const response = await apiClient.get('/chat/token');
        const token = response.data.data.token;
        if (token) {
          await signInWithCustomToken(auth, token);
          setIsFirebaseAuthed(true);
        }
      } catch (error) {
        console.error("Failed to authenticate Admin with Firebase:", error);
      }
    };

    loginFirebaseAdmin();
  }, []);

  // 2. Subscribe to active Chat Rooms once authenticated
  useEffect(() => {
    if (!isFirebaseAuthed) return;

    const roomsQuery = query(
      collection(db, 'chatRooms'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const rooms: ChatRoom[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        rooms.push({
          id: docSnap.id,
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt,
          unreadCount: data.unreadCount || 0,
          members: data.members || [],
          typingStatus: data.typingStatus || {},
        });
      });
      setChatRooms(rooms);
      setLoadingRooms(false);
    }, (error) => {
      console.error("Error subscribing to rooms:", error);
      setLoadingRooms(false);
    });

    return () => unsubscribeRooms();
  }, [isFirebaseAuthed]);

  // 3. Subscribe to active Chat Room's messages and status
  useEffect(() => {
    if (!isFirebaseAuthed || !activeRoomId) {
      setMessages([]);
      setIsCustomerTyping(false);
      return;
    }

    // Mark room unread count as 0 immediately
    updateDoc(doc(db, 'chatRooms', activeRoomId), {
      unreadCount: 0
    }).catch(err => console.error("Error resetting unreadCount:", err));

    // Subscribe to messages subcollection
    const messagesQuery = query(
      collection(db, 'chatRooms', activeRoomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: MessageData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt,
          isSeen: data.isSeen || false,
        });
      });
      setMessages(msgs);

      // Auto scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Mark incoming customer messages as seen
      const unreadCustomerMsgs = snapshot.docs.filter(
        d => d.data().senderId !== 'admin' && !d.data().isSeen
      );

      if (unreadCustomerMsgs.length > 0) {
        const batch = writeBatch(db);
        unreadCustomerMsgs.forEach((docSnap) => {
          batch.update(docSnap.ref, { isSeen: true });
        });
        batch.commit().catch(err => console.error("Error marking seen by admin:", err));
      }
    });

    // Subscribe to specific room document for customer typing indicator
    const unsubscribeRoom = onSnapshot(doc(db, 'chatRooms', activeRoomId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const customerId = data.customerId;
        setIsCustomerTyping(!!data.typingStatus?.[customerId]);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [isFirebaseAuthed, activeRoomId]);

  // Handle setting Admin typing state to true
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);

    if (!isFirebaseAuthed || !activeRoomId) return;

    // Set typingStatus.admin = true
    updateDoc(doc(db, 'chatRooms', activeRoomId), {
      'typingStatus.admin': true,
    }).catch(err => console.error(err));

    // Reset previous timeout
    if (adminTypingTimeoutRef.current) {
      clearTimeout(adminTypingTimeoutRef.current);
    }

    // Set timeout to reset typing state to false after 2.5s
    adminTypingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, 'chatRooms', activeRoomId), {
        'typingStatus.admin': false,
      }).catch(err => console.error(err));
    }, 2500);
  };

  // Send message from Admin
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !isFirebaseAuthed || !activeRoomId) return;

    const textToSend = replyText.trim();
    setReplyText("");

    // Clear typing timeout and set admin typing status to false immediately
    if (adminTypingTimeoutRef.current) {
      clearTimeout(adminTypingTimeoutRef.current);
    }
    updateDoc(doc(db, 'chatRooms', activeRoomId), {
      'typingStatus.admin': false,
    }).catch(err => console.error(err));

    try {
      // 1. Add message document
      await addDoc(collection(db, 'chatRooms', activeRoomId, 'messages'), {
        senderId: 'admin',
        senderName: 'Admin',
        text: textToSend,
        createdAt: serverTimestamp(),
        isSeen: false,
      });

      // 2. Update room details
      await updateDoc(doc(db, 'chatRooms', activeRoomId), {
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        unreadCount: 0, // Reset to 0 since Admin read and replied
      });

    } catch (error) {
      console.error("Failed to send Admin message:", error);
    }
  };

  // Get active selected room metadata
  const activeRoom = chatRooms.find((r) => r.id === activeRoomId);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col">
      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6">Trung tâm Hỗ trợ Chat</h2>

      <Row gutter={16} className="flex-1 overflow-hidden">
        {/* User List Panel */}
        <Col span={8} className="h-full">
          <Card variant="borderless" className="h-full shadow-sm overflow-auto" styles={{ body: { padding: 0 } }}>
            {loadingRooms ? (
              <div className="flex items-center justify-center p-8">
                <Spin tip="Đang tải danh sách phòng chat..." />
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                <MessageOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <Text type="secondary" className="font-medium">Chưa có cuộc hội thoại nào</Text>
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={chatRooms}
                renderItem={(room) => {
                  const isSelected = room.id === activeRoomId;
                  const timeString = room.lastMessageAt
                    ? new Date(room.lastMessageAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <List.Item
                      onClick={() => setActiveRoomId(room.id)}
                      className={`!pl-6 pr-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        isSelected ? 'bg-orange-50/40 hover:bg-orange-50/60 border-l-4 border-l-primary !pl-5' : ''
                      }`}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} className="bg-[#8c6239]" />}
                        title={
                          <div className="flex justify-between items-center pr-4">
                            <span className="font-bold text-gray-800">{room.customerName}</span>
                            <span className="text-[10px] text-gray-400">{timeString}</span>
                          </div>
                        }
                        description={
                          <div className="flex justify-between items-center mt-1 pr-4">
                            <span className="text-xs text-gray-500 truncate w-40">{room.lastMessage || 'Bắt đầu trò chuyện...'}</span>
                            {room.unreadCount !== undefined && room.unreadCount > 0 && (
                              <Badge count={room.unreadCount} className="shrink-0" />
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        {/* Chat Area Panel */}
        <Col span={16} className="h-full flex flex-col">
          {activeRoomId && activeRoom ? (
            <>
              {/* Chat Header inside Area */}
              <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shadow-sm rounded-t-2xl">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{activeRoom.customerName}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold">{activeRoom.customerEmail}</p>
                </div>
              </div>

              {/* Chat Body */}
              <Card variant="borderless" className="flex-1 shadow-sm mb-4 overflow-auto bg-[#fdfaf5]/30">
                <div className="flex flex-col gap-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 font-medium py-8">
                      Gửi tin nhắn để bắt đầu cuộc trò chuyện.
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwnMessage = msg.senderId === 'admin';
                      const timeString = msg.createdAt
                        ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';
                      const isLastMsg = index === messages.length - 1;

                      return (
                        <div key={msg.id} className={`flex flex-col gap-1 max-w-lg ${isOwnMessage ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div
                            className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                              isOwnMessage
                                ? 'bg-[#8c6239] text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[9px] text-gray-400 font-semibold">{timeString}</span>
                            {isOwnMessage && isLastMsg && msg.isSeen && (
                              <span className="text-[9px] font-bold text-green-500 bg-green-50 px-1 rounded">Đã xem</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Customer Typing Indicator */}
                  {isCustomerTyping && (
                    <div className="flex items-center gap-2 text-gray-400 italic text-[10px] font-medium ml-2 self-start animate-pulse">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      Khách hàng đang nhập tin nhắn...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </Card>

              {/* Chat Input */}
              <Card variant="borderless" className="shadow-sm rounded-b-2xl" styles={{ body: { padding: 12 } }}>
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn trả lời khách hàng..."
                    value={replyText}
                    onChange={handleInputChange}
                    className="flex-1 rounded-lg"
                    onPressEnter={handleSend}
                  />
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{ backgroundColor: '#8c6239' }}
                    icon={<SendOutlined />}
                    className="rounded-lg h-auto px-6"
                    disabled={!replyText.trim()}
                  />
                </form>
              </Card>
            </>
          ) : (
            <div className="flex-1 bg-white rounded-2xl flex flex-col items-center justify-center text-gray-400 shadow-sm">
              <MessageOutlined style={{ fontSize: 40, color: '#d3d3d3', marginBottom: 12 }} />
              <p className="font-semibold text-gray-400 text-sm">Chọn một cuộc trò chuyện để bắt đầu hỗ trợ</p>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ChatWindow;

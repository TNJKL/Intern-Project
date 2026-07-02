import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, List, Avatar, Input, Button, Badge, Spin, Typography, Segmented, DatePicker } from 'antd';
import { SendOutlined, UserOutlined, MessageOutlined, CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { apiClient } from '../../lib/api';
import { auth, db } from '../../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useAuthStore } from '../../store/zustand/useAuthStore';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/vi_VN';

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
  status?: 'unassigned' | 'assigned' | 'closed';
  assignedTo?: string | null;
  assignedName?: string | null;
}

interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isSeen: boolean;
}

const getDisplayName = (name: string, email: string) => {
  if (name && name.startsWith('Guest (')) {
    return email || name.replace('Guest (', '').replace(')', '');
  }
  return name;
};

const quickReplies = [
  "Brewtra xin chào! Tôi có thể giúp gì cho bạn? ☕",
  "Dạ, bạn vui lòng cho tôi xin mã đơn hàng để tôi kiểm tra giúp nhé. 📦",
  "Dạ, Brewtra đã nhận thông tin và sẽ xử lý ngay cho bạn nhé! 🚀"
];

const ChatWindow: React.FC = () => {
  const { user } = useAuthStore();
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [postgresMessages, setPostgresMessages] = useState<MessageData[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
  const [filterDate, setFilterDate] = useState<any>(null);
  const prevUnreadCountsRef = useRef<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickRepliesRef = useRef<HTMLDivElement>(null);
  const adminTypingTimeoutRef = useRef<any>(null);
  const isLocalTypingRef = useRef(false);

  const currentAdminId = user?.id || 'admin_default';
  const currentAdminName = user?.fullName || 'Admin';

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
      orderBy('lastMessageAt', 'desc'),
      limit(50)
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
          status: data.status || 'unassigned',
          assignedTo: data.assignedTo || null,
          assignedName: data.assignedName || null,
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

  const handleClaimRoom = async (roomId: string) => {
    if (!isFirebaseAuthed) return;
    try {
      await updateDoc(doc(db, 'chatRooms', roomId), {
        status: 'assigned',
        assignedTo: currentAdminId,
        assignedName: currentAdminName,
      });
    } catch (err) {
      console.error("Error claiming room:", err);
    }
  };

  const handleCloseRoom = async (roomId: string) => {
    if (!isFirebaseAuthed) return;
    try {
      await apiClient.post(`/chat/rooms/${roomId}/archive`, {
        adminId: currentAdminId,
        adminName: currentAdminName,
      });
      // Keep the room active/selected so that the admin can view the closed history immediately
    } catch (err) {
      console.error("Error closing/archiving room:", err);
    }
  };

  // 3. Subscribe to active Chat Room's messages and status
  useEffect(() => {
    if (!isFirebaseAuthed || !activeRoomId) {
      setMessages([]);
      setPostgresMessages([]);
      setIsHistoryLoaded(false);
      setIsCustomerTyping(false);
      return;
    }

    setIsHistoryLoaded(false);

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
      setIsHistoryLoaded(true);

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

  // Load archived chat history from Postgres for Admin when room is opened and live messages are empty
  useEffect(() => {
    if (!isHistoryLoaded || !activeRoomId) return;

    if (messages.length > 0) {
      setPostgresMessages([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await apiClient.get(`/chat/history?roomId=${activeRoomId}`);
        if (response.data.success && response.data.data.messages) {
          setPostgresMessages(response.data.data.messages);
        }
      } catch (err) {
        console.error("Error loading chat history from Postgres:", err);
      }
    };

    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded, activeRoomId]);

  // 2.5. Listen to chatRooms changes to play sound chime and flash title for new messages
  useEffect(() => {
    let hasNewIncomingMessage = false;
    const newCounts: Record<string, number> = {};

    chatRooms.forEach((room) => {
      newCounts[room.id] = room.unreadCount || 0;
      const prevCount = prevUnreadCountsRef.current[room.id] || 0;

      // If unreadCount increased, it means a new message from customer arrived
      if ((room.unreadCount || 0) > prevCount) {
        // Only alert if we are not currently viewing this room, or if window is not focused
        if (room.id !== activeRoomId || !document.hasFocus()) {
          hasNewIncomingMessage = true;
        }
      }
    });

    prevUnreadCountsRef.current = newCounts;

    if (hasNewIncomingMessage) {
      playNotificationSound();
      triggerTitleFlash();
    }
  }, [chatRooms, activeRoomId]);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Tone 1 (Ding)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2 (Dong)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.error("Failed to play custom notification chime:", e);
    }
  };

  const triggerTitleFlash = () => {
    if (document.hasFocus()) return;
    if ((window as any)._titleFlashInterval) return;

    const originalTitle = document.title;
    let isFlash = false;

    const interval = setInterval(() => {
      document.title = isFlash ? `💬 Tin nhắn mới!` : originalTitle;
      isFlash = !isFlash;
    }, 1000);

    (window as any)._titleFlashInterval = interval;

    const handleFocus = () => {
      clearInterval(interval);
      delete (window as any)._titleFlashInterval;
      document.title = originalTitle;
      window.removeEventListener('focus', handleFocus);
    };
    window.addEventListener('focus', handleFocus);
  };

  // Handle setting Admin typing state to true
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);

    if (!isFirebaseAuthed || !activeRoomId) return;

    if (!isLocalTypingRef.current) {
      isLocalTypingRef.current = true;
      updateDoc(doc(db, 'chatRooms', activeRoomId), {
        'typingStatus.admin': true,
      }).catch(err => console.error(err));
    }

    // Reset previous timeout
    if (adminTypingTimeoutRef.current) {
      clearTimeout(adminTypingTimeoutRef.current);
    }

    // Set timeout to reset typing state to false after 2.5s
    adminTypingTimeoutRef.current = setTimeout(() => {
      isLocalTypingRef.current = false;
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
    isLocalTypingRef.current = false;
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

  const scrollQuickReplies = (direction: 'left' | 'right') => {
    if (quickRepliesRef.current) {
      const scrollAmount = 200;
      quickRepliesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get active selected room metadata
  const activeRoom = chatRooms.find((r) => r.id === activeRoomId);

  // Filter chat rooms based on active tab
  const filteredRooms = chatRooms.filter((room) => {
    // Apply Date selector filter if present
    if (filterDate && room.lastMessageAt) {
      const messageDate = new Date(room.lastMessageAt.seconds * 1000);
      const selectedDateStr = filterDate.format('YYYY-MM-DD');
      const localMsgDateStr = `${messageDate.getFullYear()}-${String(messageDate.getMonth() + 1).padStart(2, '0')}-${String(messageDate.getDate()).padStart(2, '0')}`;
      if (localMsgDateStr !== selectedDateStr) {
        return false;
      }
    }

    // If it is assigned to someone else, it should NEVER show in "mine" tab
    if (room.status === 'assigned' && room.assignedTo !== currentAdminId) {
      if (activeTab === 'mine') {
        return false;
      }
    }

    // If it's the currently active room, always keep it in the list so it doesn't vanish while viewing
    if (activeRoomId === room.id) {
      return true;
    }

    if (activeTab === 'mine') {
      return room.status === 'assigned' && room.assignedTo === currentAdminId;
    }
    if (activeTab === 'all') {
      return true;
    }
    return true;
  });

  // If the active room gets filtered out of the current tab's list, deselect it
  useEffect(() => {
    if (activeRoomId) {
      const isVisible = filteredRooms.some((r) => r.id === activeRoomId);
      if (!isVisible) {
        setActiveRoomId(null);
      }
    }
  }, [activeRoomId, activeTab, chatRooms, currentAdminId]);

  // Calculate unread counts for badges
  const mineUnreadCount = chatRooms
    .filter((room) => room.status === 'assigned' && room.assignedTo === currentAdminId)
    .reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  const allUnreadCount = chatRooms
    .filter((room) => room.status !== 'closed')
    .reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  const getMessageDateString = (msg: MessageData) => {
    if (!msg.createdAt) return '';
    if (msg.createdAt.seconds !== undefined) {
      const date = new Date(msg.createdAt.seconds * 1000);
      return date.toDateString();
    }
    const date = new Date(msg.createdAt);
    return date.toDateString();
  };

  const formatMsgTime = (createdAt: any) => {
    if (!createdAt) return '';
    if (createdAt.seconds !== undefined) {
      return new Date(createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSeparatorDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const allMessages = (() => {
    const list: MessageData[] = [];
    const seenIds = new Set<string>();

    for (const pm of postgresMessages) {
      if (pm.id && !seenIds.has(pm.id)) {
        seenIds.add(pm.id);
        list.push(pm);
      }
    }

    for (const m of messages) {
      if (m.id) {
        if (seenIds.has(m.id)) {
          const idx = list.findIndex((item) => item.id === m.id);
          if (idx !== -1) {
            list[idx] = m;
          }
        } else {
          seenIds.add(m.id);
          list.push(m);
        }
      }
    }
    return list;
  })();

  return (
    <div className="h-full min-h-[500px] flex flex-col">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <Row gutter={16} className="flex-1 overflow-hidden">
        {/* User List Panel */}
        <Col span={8} className="h-full flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <DatePicker
              placeholder="Lọc theo ngày..."
              value={filterDate}
              onChange={(date) => setFilterDate(date)}
              className="flex-1 rounded-lg"
              locale={locale}
              format="DD/MM/YYYY"
            />
          </div>

          <Segmented
            block
            value={activeTab}
            onChange={(value: any) => setActiveTab(value)}
            options={[
              {
                label: (
                  <span className="flex items-center justify-center gap-1.5 font-bold">
                    Của tôi
                    {mineUnreadCount > 0 && (
                      <Badge
                        count={mineUnreadCount}
                        size="small"
                        style={{ backgroundColor: '#8c6239' }}
                      />
                    )}
                  </span>
                ),
                value: 'mine'
              },
              {
                label: (
                  <span className="flex items-center justify-center gap-1.5 font-bold">
                    Tất cả
                    {allUnreadCount > 0 && (
                      <Badge
                        count={allUnreadCount}
                        size="small"
                        style={{ backgroundColor: '#8c6239' }}
                      />
                    )}
                  </span>
                ),
                value: 'all'
              },
            ]}
          />

          <Card variant="borderless" className="flex-1 shadow-sm overflow-y-auto overflow-x-hidden" styles={{ body: { padding: 0 } }}>
            {loadingRooms ? (
              <div className="flex items-center justify-center p-8">
                <Spin tip="Đang tải danh sách phòng chat..." />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                <MessageOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <Text type="secondary" className="font-medium">Chưa có cuộc hội thoại nào</Text>
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={filteredRooms}
                renderItem={(room) => {
                  const isSelected = room.id === activeRoomId;
                  const timeString = room.lastMessageAt
                    ? new Date(room.lastMessageAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <List.Item
                      onClick={() => setActiveRoomId(room.id)}
                      className={`!pl-6 pr-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${isSelected ? 'bg-orange-50/40 hover:bg-orange-50/60 border-l-4 border-l-primary !pl-5' : ''
                        } ${room.status === 'closed' ? 'opacity-65 bg-gray-50/40' : ''}`}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} className="bg-[#8c6239]" />}
                        title={
                          <div className="flex items-center gap-1.5 w-full min-w-0 pr-4">
                            <span className="font-bold text-gray-800 truncate" title={getDisplayName(room.customerName, room.customerEmail)}>
                              {getDisplayName(room.customerName, room.customerEmail)}
                            </span>
                            {room.status === 'assigned' && (
                              <span className="text-[10px] font-normal text-gray-400 shrink-0">
                                ({room.assignedTo === currentAdminId ? 'Của tôi' : room.assignedName || 'Admin khác'})
                              </span>
                            )}
                            {room.status === 'closed' && (
                              <span className="text-[10px] font-bold text-red-500 shrink-0">
                                (Đã đóng)
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{timeString}</span>
                          </div>
                        }
                        description={
                          <div className="flex items-center justify-between mt-1 min-w-0 w-full pr-4">
                            <span className="text-xs text-gray-500 truncate pr-2 flex-1 min-w-0">{room.lastMessage || 'Bắt đầu trò chuyện...'}</span>
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
              <div className="bg-white px-6 py-2.5 border-b border-gray-100 flex items-center justify-between shadow-sm rounded-t-2xl">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">
                    {activeRoom.customerName.startsWith('Guest (') ? 'Khách vãng lai' : activeRoom.customerName}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold">{activeRoom.customerEmail}</p>
                </div>
                {activeRoom.status === 'assigned' && activeRoom.assignedTo === currentAdminId && (
                  <Button
                    type="default"
                    danger
                    onClick={() => handleCloseRoom(activeRoom.id)}
                    className="font-bold text-xs"
                  >
                    Hoàn thành tư vấn
                  </Button>
                )}
              </div>

              {/* Chat Body */}
              <Card variant="borderless" className="flex-1 shadow-sm mb-2 overflow-y-auto overflow-x-hidden bg-[#fdfaf5]/30">
                <div className="flex flex-col gap-4">
                  {allMessages.length === 0 ? (
                    <div className="text-center text-gray-400 font-medium py-8">
                      Gửi tin nhắn để bắt đầu cuộc trò chuyện.
                    </div>
                  ) : (() => {
                    let lastDateStr = '';
                    return allMessages.map((msg, index) => {
                      const isOwnMessage = msg.senderId === 'admin';
                      const timeString = formatMsgTime(msg.createdAt);
                      const isLastMsg = index === allMessages.length - 1;
                      const msgDateStr = getMessageDateString(msg);
                      const showDateSeparator = msgDateStr && msgDateStr !== lastDateStr;
                      lastDateStr = msgDateStr;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateSeparator && (
                            <div className="w-full flex items-center justify-center my-3">
                              <span className="bg-orange-100/50 text-[#8c6239] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                {formatSeparatorDate(msgDateStr)}
                              </span>
                            </div>
                          )}
                          <div className={`flex flex-col gap-1 max-w-lg ${isOwnMessage ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div
                              className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${isOwnMessage
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
                        </React.Fragment>
                      );
                    });
                  })()}

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

              {/* Chat Input or Claim controls */}
              {activeRoom.status === 'closed' ? (
                <Card variant="borderless" className="shadow-sm rounded-b-2xl text-center bg-gray-50/50" styles={{ body: { padding: 16 } }}>
                  <div className="flex flex-col items-center gap-2">
                    <Text type="secondary" className="font-semibold text-red-500">
                      Cuộc trò chuyện này đã hoàn thành tư vấn.
                    </Text>
                    <Button
                      type="primary"
                      onClick={() => handleClaimRoom(activeRoom.id)}
                      style={{ backgroundColor: '#8c6239' }}
                    >
                      Mở lại hỗ trợ
                    </Button>
                  </div>
                </Card>
              ) : activeRoom.status === 'assigned' && activeRoom.assignedTo === currentAdminId ? (
                <Card variant="borderless" className="shadow-sm rounded-b-2xl" styles={{ body: { padding: 10 } }}>
                  <div className="flex items-center gap-1.5 mb-2 w-full">
                    <Button 
                      type="text" 
                      size="small" 
                      style={{ padding: 0, width: 20, height: 20 }}
                      icon={<LeftOutlined style={{ fontSize: 9 }} />} 
                      onClick={() => scrollQuickReplies('left')}
                      className="flex items-center justify-center shrink-0 border border-orange-100/40 hover:bg-orange-50/50 text-[#8c6239]"
                    />
                    <div 
                      ref={quickRepliesRef}
                      className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1 flex-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReplyText(reply)}
                          className="text-[10px] bg-orange-50/50 hover:bg-orange-100 text-[#8c6239] border border-orange-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    <Button 
                      type="text" 
                      size="small" 
                      style={{ padding: 0, width: 20, height: 20 }}
                      icon={<RightOutlined style={{ fontSize: 9 }} />} 
                      onClick={() => scrollQuickReplies('right')}
                      className="flex items-center justify-center shrink-0 border border-orange-100/40 hover:bg-orange-50/50 text-[#8c6239]"
                    />
                  </div>
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
              ) : (
                <Card variant="borderless" className="shadow-sm rounded-b-2xl text-center bg-gray-50/50" styles={{ body: { padding: 16 } }}>
                  {activeRoom.status === 'assigned' ? (
                    <Text type="secondary" className="font-semibold italic">
                      Nhân viên {activeRoom.assignedName || 'khác'} đang hỗ trợ khách hàng này.
                    </Text>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Text type="secondary" className="font-semibold">
                        Cuộc trò chuyện này chưa có người tiếp nhận.
                      </Text>
                      <Button
                        type="primary"
                        onClick={() => handleClaimRoom(activeRoom.id)}
                        style={{ backgroundColor: '#8c6239' }}
                      >
                        Tiếp nhận hỗ trợ
                      </Button>
                    </div>
                  )}
                </Card>
              )}
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

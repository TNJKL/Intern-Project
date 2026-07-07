import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row } from 'antd';
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
  writeBatch,
  limitToLast
} from 'firebase/firestore';
import { useAuthStore } from '../../store/zustand/useAuthStore';
import { RoomList } from './RoomList';
import type { ChatRoom } from './RoomList';
import { ChatArea } from './ChatArea';
import type { MessageData } from './ChatArea';

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
      orderBy('createdAt', 'asc'),
      limitToLast(50)
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

  const allMessages = useMemo(() => {
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
  }, [postgresMessages, messages]);

  return (
    <div className="h-full min-h-[500px] flex flex-col">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <Row gutter={16} className="flex-1 overflow-hidden">
        <RoomList
          chatRooms={chatRooms}
          filteredRooms={filteredRooms}
          activeRoomId={activeRoomId}
          onSelectRoom={setActiveRoomId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filterDate={filterDate}
          onFilterDateChange={setFilterDate}
          loadingRooms={loadingRooms}
          mineUnreadCount={mineUnreadCount}
          allUnreadCount={allUnreadCount}
          currentAdminId={currentAdminId}
        />

        <ChatArea
          activeRoom={activeRoom}
          allMessages={allMessages}
          isCustomerTyping={isCustomerTyping}
          replyText={replyText}
          onReplyTextChange={handleInputChange}
          onSend={handleSend}
          onClaimRoom={handleClaimRoom}
          onCloseRoom={handleCloseRoom}
          currentAdminId={currentAdminId}
          messagesEndRef={messagesEndRef}
          quickRepliesRef={quickRepliesRef}
          scrollQuickReplies={scrollQuickReplies}
          quickReplies={quickReplies}
          setReplyText={setReplyText}
          formatMsgTime={formatMsgTime}
          getMessageDateString={getMessageDateString}
          formatSeparatorDate={formatSeparatorDate}
          isHistoryLoaded={isHistoryLoaded}
        />
      </Row>
    </div>
  );
};

export default ChatWindow;

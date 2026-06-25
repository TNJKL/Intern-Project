"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../store/redux/hooks';
import { apiClient } from '../../lib/api';
import { auth, db } from '../../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  updateDoc,
  writeBatch,
  getDocs,
  where
} from 'firebase/firestore';

interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isSeen: boolean;
}

const clientQuickReplies = [
  "Tôi muốn tư vấn về voucher khuyến mãi hôm nay 🎁",
  "Tôi muốn kiểm tra trạng thái đơn hàng gần đây 📦",
  "Quán có món nước nào ngon nhất vậy ạ? ☕"
];

const getMessageDateString = (msg: MessageData) => {
  if (!msg.createdAt) return '';
  if (msg.createdAt.seconds !== undefined) {
    const date = new Date(msg.createdAt.seconds * 1000);
    return date.toDateString();
  }
  const date = new Date(msg.createdAt);
  return date.toDateString();
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

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignedName, setAssignedName] = useState<string | null>(null);
  const [postgresMessages, setPostgresMessages] = useState<MessageData[]>([]);
  const [roomStatus, setRoomStatus] = useState<string>('unassigned');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const prevUnreadCountRef = useRef(0);

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
      osc1.frequency.setValueAtTime(880, now);
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
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
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

  const formatMsgTime = (createdAt: any) => {
    if (!createdAt) return '';
    if (createdAt.seconds !== undefined) {
      return new Date(createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const { isAuthenticated, accessToken, user } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalTypingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Check saved guest email on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('chat_guest_email') || "";
      setGuestEmail(savedEmail);
      setEmailInput(savedEmail);
    }
  }, []);

  // Reset Firebase authentication when user identity changes
  useEffect(() => {
    setIsFirebaseAuthed(false);
    setChatRoomId(null);
    setMessages([]);
    setPostgresMessages([]);
    setIsHistoryLoaded(false);
  }, [isAuthenticated, guestEmail, accessToken]);

  // Sync / Login with Firebase when chat widget is opened or auth status changes
  useEffect(() => {
    if (!isOpen) return;

    const authenticateFirebase = async () => {
      // Skip authentication if we are already authenticated for this session/room
      if (isFirebaseAuthed && chatRoomId) {
        return;
      }

      setLoading(true);
      try {
        let token = "";
        let uid = "";

        if (isAuthenticated && accessToken) {
          // Member Flow
          const response = await apiClient.get('/chat/token', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          token = response.data.data.token;
          uid = response.data.data.uid;
        } else if (guestEmail) {
          // Guest Flow
          const response = await apiClient.get(`/chat/token?email=${guestEmail}`);
          token = response.data.data.token;
          uid = response.data.data.uid;
        } else {
          // No email / not logged in -> Wait for email input
          setLoading(false);
          return;
        }

        if (token) {
          await signInWithCustomToken(auth, token);
          const cleanEmailUid = uid.replace('guest_', '');
          const roomId = isAuthenticated && user?.id ? `room_${user.id}` : `room_guest_${cleanEmailUid}`;

          // Create/Init chat room in Firestore FIRST to prevent permission errors on listener
          await setDoc(doc(db, 'chatRooms', roomId), {
            id: roomId,
            customerId: uid,
            customerName: isAuthenticated && user?.fullName ? user.fullName : `Guest (${guestEmail})`,
            customerEmail: isAuthenticated && user?.email ? user.email : guestEmail,
            members: [uid, 'admin'],
          }, { merge: true });

          setChatRoomId(roomId);
          setIsFirebaseAuthed(true);
        }
      } catch (error) {
        console.error("Firebase auth error in ChatWidget:", error);
      } finally {
        setLoading(false);
      }
    };

    authenticateFirebase();
  }, [isOpen, isAuthenticated, accessToken, guestEmail, isFirebaseAuthed, chatRoomId]);

  // Subscribe to messages and typing status once authenticated in Firebase
  useEffect(() => {
    if (!isFirebaseAuthed || !chatRoomId) return;

    // 1. Subscribe to Messages
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    let isFirstLoad = true;
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: MessageData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt,
          isSeen: data.isSeen,
        });
      });
      setMessages(msgs);
      setIsHistoryLoaded(true);

      // Check if a new message from Admin was added in this snapshot
      const hasNewAdminMsg = snapshot.docChanges().some(change => {
        return change.type === 'added' && change.doc.data().senderId === 'admin';
      });

      if (hasNewAdminMsg && !isFirstLoad) {
        if (!isOpen || !document.hasFocus()) {
          playNotificationSound();
          triggerTitleFlash();
        }
      }
      isFirstLoad = false;

      // Auto scroll and mark seen only if the widget is actually open
      if (isOpen) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // 2. Mark Admin messages as seen
        const unreadAdminMsgs = snapshot.docs.filter(
          d => d.data().senderId === 'admin' && !d.data().isSeen
        );

        if (unreadAdminMsgs.length > 0) {
          const batch = writeBatch(db);
          unreadAdminMsgs.forEach((docSnap) => {
            batch.update(docSnap.ref, { isSeen: true });
          });
          batch.commit().catch(err => console.error("Error marking seen:", err));
        }
      }
    });

    // 3. Subscribe to Chat Room document for Admin typing indicator & metadata
    const unsubscribeRoom = onSnapshot(doc(db, 'chatRooms', chatRoomId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsAdminTyping(!!data.typingStatus?.admin);
        setAssignedName(data.assignedName || null);
        setRoomStatus(data.status || 'unassigned');
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [isFirebaseAuthed, chatRoomId, isOpen]);

  // Load archived chat history from Postgres ONCE when the room is first authenticated.
  // We only load it once (when isHistoryLoaded first becomes true and Firestore has 0 msgs).
  // If Firestore already has live messages, Postgres history is irrelevant.
  useEffect(() => {
    if (!isHistoryLoaded || !chatRoomId || !isOpen) return;
    // Only fetch Postgres history if Firestore has no live messages for this room
    if (messages.length > 0) {
      setPostgresMessages([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await apiClient.get(`/chat/history?roomId=${chatRoomId}`);
        if (response.data.success && response.data.data.messages) {
          setPostgresMessages(response.data.data.messages);
        }
      } catch (err) {
        console.error("Error loading chat history from Postgres:", err);
      }
    };

    loadHistory();
    // Only run once after Firestore first confirms 0 live messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded, chatRoomId, isOpen]);

  // Handle setting up guest email
  const handleRegisterGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      alert("Định dạng email không hợp lệ");
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_guest_email', emailInput);
    }
    setGuestEmail(emailInput);
  };

  // Handle typing status notification to Firestore
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isFirebaseAuthed || !chatRoomId) return;

    const currentUserId = isAuthenticated && user?.id ? user.id : `guest_${guestEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (!isLocalTypingRef.current) {
      isLocalTypingRef.current = true;
      updateDoc(doc(db, 'chatRooms', chatRoomId), {
        [`typingStatus.${currentUserId}`]: true,
      }).catch(err => console.error(err));
    }

    // Reset old timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to reset typing state to false after 2.5 seconds
    typingTimeoutRef.current = setTimeout(() => {
      isLocalTypingRef.current = false;
      updateDoc(doc(db, 'chatRooms', chatRoomId), {
        [`typingStatus.${currentUserId}`]: false,
      }).catch(err => console.error(err));
    }, 2500);
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isFirebaseAuthed || !chatRoomId) return;

    const senderId = isAuthenticated && user?.id ? user.id : `guest_${guestEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const senderName = isAuthenticated && user?.fullName ? user.fullName : `Guest (${guestEmail})`;
    const textToSend = message.trim();
    setMessage("");

    // Clear typing timeout and immediately set typingStatus to false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isLocalTypingRef.current = false;
    updateDoc(doc(db, 'chatRooms', chatRoomId), {
      [`typingStatus.${senderId}`]: false,
    }).catch(err => console.error(err));

    try {
      // 1. Add message document
      await addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), {
        senderId,
        senderName,
        text: textToSend,
        createdAt: serverTimestamp(),
        isSeen: false,
      });

      // 2. Update room metadata for admin overview
      const roomUpdate: any = {
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        unreadCount: increment(1),
      };

      if (roomStatus === 'closed') {
        roomUpdate.status = 'unassigned';
        roomUpdate.assignedTo = null;
        roomUpdate.assignedName = null;
      }

      await setDoc(doc(db, 'chatRooms', chatRoomId), roomUpdate, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendQuickReply = async (text: string) => {
    if (!isFirebaseAuthed || !chatRoomId) return;

    // Collapse quick replies list on select to overlay message area smoothly
    setShowQuickReplies(false);

    const senderId = isAuthenticated && user?.id ? user.id : `guest_${guestEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const senderName = isAuthenticated && user?.fullName ? user.fullName : `Guest (${guestEmail})`;

    try {
      // 1. Add message document
      await addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), {
        senderId,
        senderName,
        text,
        createdAt: serverTimestamp(),
        isSeen: false,
      });

      // 2. Update room metadata for admin overview
      const roomUpdate: any = {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadCount: increment(1),
      };

      if (roomStatus === 'closed') {
        roomUpdate.status = 'unassigned';
        roomUpdate.assignedTo = null;
        roomUpdate.assignedName = null;
      }

      await setDoc(doc(db, 'chatRooms', chatRoomId), roomUpdate, { merge: true });

    } catch (error) {
      console.error("Error sending quick reply:", error);
    }
  };

  const handleLogoutChat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chat_guest_email');
    }
    setGuestEmail("");
    setEmailInput("");
    setIsFirebaseAuthed(false);
    setChatRoomId(null);
    setMessages([]);
  };

  const unreadCount = messages.filter((m) => m.senderId === 'admin' && !m.isSeen).length;

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
            list[idx] = m; // Update with latest real-time status (like isSeen)
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
    <div className="fixed bottom-[96px] right-3 lg:bottom-8 lg:right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute z-10 bottom-[72px] lg:bottom-[96px] right-0 w-[300px] sm:w-[350px] h-[500px] sm:h-[540px] max-h-[calc(100vh-140px)] bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden border border-gray-150"
          >
            {/* Header */}
            <div className="bg-primary p-4 sm:p-5 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">Hỗ trợ Brewtra</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold opacity-80">
                      {assignedName && roomStatus !== 'closed' ? `Nhân viên: ${assignedName}` : 'Hệ thống tự động'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isAuthenticated && guestEmail && (
                  <button
                    onClick={handleLogoutChat}
                    className="text-[9px] bg-white/20 hover:bg-white/35 font-bold px-2 py-1 rounded-md transition-colors"
                  >
                    Đổi Email
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 sm:p-2 rounded-full transition-colors">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#fdfaf5]/50 flex flex-col gap-4">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-400 font-medium">Đang kết nối...</span>
                </div>
              ) : !isAuthenticated && !guestEmail ? (
                // Guest Login Screen
                <div className="flex-1 flex flex-col justify-center items-center p-4">
                  <div className="w-12 h-12 bg-orange-50 text-primary rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm text-center mb-2">Bắt đầu Trò chuyện Hỗ trợ</h4>
                  <p className="text-xs text-gray-500 text-center mb-6 max-w-[240px]">
                    Vui lòng cung cấp email của bạn để chúng tôi lưu giữ lịch sử chat và phản hồi nhanh nhất.
                  </p>
                  <form onSubmit={handleRegisterGuest} className="w-full space-y-3">
                    <input
                      type="email"
                      required
                      placeholder="Nhập email của bạn..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all"
                    >
                      Bắt đầu chat
                    </button>
                  </form>
                </div>
              ) : (
                // Messages List
                <>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                        Chào bạn! Brewtra có thể giúp gì cho bạn hôm nay không? ☕
                      </p>
                    </div>
                  </div>

                  {(() => {
                    let lastDateStr = '';
                    return allMessages.map((msg, index) => {
                      const isOwnMessage = msg.senderId !== 'admin';
                      const timeString = formatMsgTime(msg.createdAt);
                      const isLastMsg = index === allMessages.length - 1;
                      const msgDateStr = getMessageDateString(msg);
                      const showDateSeparator = msgDateStr && msgDateStr !== lastDateStr;
                      lastDateStr = msgDateStr;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateSeparator && (
                            <div className="w-full flex items-center justify-center my-3">
                              <span className="bg-orange-100/50 text-[#8c6239] text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {formatSeparatorDate(msgDateStr)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex flex-col gap-1 max-w-[85%] ${isOwnMessage ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <div
                              className={`p-3 sm:p-3.5 rounded-2xl shadow-sm border text-xs sm:text-sm font-medium leading-relaxed
                                ${isOwnMessage
                                  ? 'bg-primary text-white border-primary rounded-br-none'
                                  : 'bg-white text-gray-700 border-gray-100 rounded-bl-none'}`}
                            >
                              <p>{msg.text}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-1">
                              <span className="text-[9px] font-bold text-gray-400">{timeString}</span>
                              {isOwnMessage && isLastMsg && msg.isSeen && (
                                <span className="text-[9px] font-bold text-green-500 bg-green-50 px-1 rounded">Đã xem</span>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}

                  {/* Typing Indicator */}
                  {isAdminTyping && (
                    <div className="flex items-center gap-2 text-gray-400 italic text-[10px] font-medium ml-2 self-start animate-pulse">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      Nhân viên đang gõ tin nhắn...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Form & Suggestions Container */}
            {((isAuthenticated && accessToken) || guestEmail) && (
              <div className="relative bg-white border-t border-gray-100 flex flex-col shrink-0">
                {/* Expand/Collapse Toggle Bar */}
                {isHistoryLoaded && (
                  <div
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="flex items-center justify-between px-4 py-1.5 bg-transparent cursor-pointer select-none transition-colors"
                  >
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-[#8c6239] rounded-full animate-pulse"></span>
                      Gợi ý câu hỏi nhanh
                    </span>
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full bg-orange-50 hover:bg-orange-100 text-[#8c6239] flex items-center justify-center transition-all focus:outline-none cursor-pointer active:scale-90"
                    >
                      {showQuickReplies ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Vertical list of quick replies overlaying the chat body */}
                {isHistoryLoaded && showQuickReplies && (
                  <div className="absolute bottom-[100%] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-12px_30px_rgba(0,0,0,0.06)] p-3.5 flex flex-col gap-2 max-h-[170px] overflow-y-auto custom-scrollbar z-[60] rounded-t-xl">
                    {clientQuickReplies.map((reply, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleSendQuickReply(reply);
                        }}
                        className="text-left text-[11px] leading-relaxed bg-orange-50/40 hover:bg-orange-100/60 text-[#8c6239] border border-orange-100/30 rounded-xl p-2.5 transition-all shadow-sm active:scale-98 font-semibold cursor-pointer"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} className="p-3 sm:p-4 flex items-center gap-3 bg-white z-[70]">
                  <input
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    disabled={!isFirebaseAuthed}
                    className="flex-1 bg-gray-50 border-none rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || !isFirebaseAuthed}
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={(!isOpen && unreadCount > 0) ? {
          rotate: [0, -10, 10, -10, 10, -5, 5, 0],
          scale: [1, 1.08, 1.08, 1.08, 1.08, 1.04, 1.04, 1]
        } : { rotate: 0, scale: 1 }}
        transition={(!isOpen && unreadCount > 0) ? {
          duration: 0.6,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 1.5
        } : { duration: 0.2 }}
        className="relative w-12 h-12 lg:w-16 lg:h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(211,117,51,0.35)] lg:shadow-[0_15px_30px_-5px_rgba(211,117,51,0.4)] group focus:outline-none"
      >
        <MessageCircle className="w-6 h-6 lg:w-8 lg:h-8" />
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] lg:text-[10px] font-black w-4.5 h-4.5 lg:w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md z-[110]">
            {unreadCount}
          </div>
        )}
      </motion.button>
    </div>
  );
}

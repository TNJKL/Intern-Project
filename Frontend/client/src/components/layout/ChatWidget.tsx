"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
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

  const { isAuthenticated, accessToken, user } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check saved guest email on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('chat_guest_email') || "";
      setGuestEmail(savedEmail);
      setEmailInput(savedEmail);
    }
  }, []);

  // Sync / Login with Firebase when chat widget is opened or auth status changes
  useEffect(() => {
    if (!isOpen) return;

    const authenticateFirebase = async () => {
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
          
          setChatRoomId(roomId);
          setIsFirebaseAuthed(true);

          // Create/Init chat room in Firestore if not exists
          await setDoc(doc(db, 'chatRooms', roomId), {
            id: roomId,
            customerId: uid,
            customerName: isAuthenticated && user?.fullName ? user.fullName : `Guest (${guestEmail})`,
            customerEmail: isAuthenticated && user?.email ? user.email : guestEmail,
            members: [uid, 'admin'],
          }, { merge: true });
        }
      } catch (error) {
        console.error("Firebase auth error in ChatWidget:", error);
      } finally {
        setLoading(false);
      }
    };

    authenticateFirebase();
  }, [isOpen, isAuthenticated, accessToken, guestEmail]);

  // Subscribe to messages and typing status once authenticated in Firebase
  useEffect(() => {
    if (!isFirebaseAuthed || !chatRoomId) return;

    // 1. Subscribe to Messages
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

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
      
      // Auto scroll to bottom
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
    });

    // 3. Subscribe to Chat Room document for Admin typing indicator
    const unsubscribeRoom = onSnapshot(doc(db, 'chatRooms', chatRoomId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsAdminTyping(!!data.typingStatus?.admin);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [isFirebaseAuthed, chatRoomId]);

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

    // Set typing state to true
    updateDoc(doc(db, 'chatRooms', chatRoomId), {
      [`typingStatus.${currentUserId}`]: true,
    }).catch(err => console.error(err));

    // Reset old timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to reset typing state to false after 2.5 seconds
    typingTimeoutRef.current = setTimeout(() => {
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
      await setDoc(doc(db, 'chatRooms', chatRoomId), {
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        unreadCount: increment(1),
      }, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
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

  return (
    <div className="fixed bottom-[96px] right-3 lg:bottom-8 lg:right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute z-10 bottom-[72px] lg:bottom-[96px] right-0 w-[320px] sm:w-[400px] h-[420px] sm:h-[480px] max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)] bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-primary p-4 sm:p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">Hỗ trợ Brewtra</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold opacity-80">Trực tuyến</span>
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

                  {messages.map((msg, index) => {
                    const isOwnMessage = msg.senderId !== 'admin';
                    const timeString = msg.createdAt
                      ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const isLastMsg = index === messages.length - 1;

                    return (
                      <div 
                        key={msg.id} 
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
                    );
                  })}

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

            {/* Input Form */}
            {((isAuthenticated && accessToken) || guestEmail) && (
              <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center gap-3">
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
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 lg:w-16 lg:h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(211,117,51,0.35)] lg:shadow-[0_15px_30px_-5px_rgba(211,117,51,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 lg:w-8 lg:h-8" />
          {!isOpen && (
            <div className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 w-3 h-3 lg:w-4 lg:h-4 bg-red-500 border-2 border-primary rounded-full animate-bounce"></div>
          )}
        </div>
      </button>
    </div>
  );
}

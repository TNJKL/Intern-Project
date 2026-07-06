import React from 'react';
import { Card, Col, Input, Button, Typography } from 'antd';
import { SendOutlined, MessageOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { ChatRoom } from './RoomList';

const { Text } = Typography;

export interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isSeen: boolean;
}

interface ChatAreaProps {
  activeRoom: ChatRoom | undefined;
  allMessages: MessageData[];
  isCustomerTyping: boolean;
  replyText: string;
  onReplyTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: (e?: React.FormEvent) => void;
  onClaimRoom: (roomId: string) => void;
  onCloseRoom: (roomId: string) => void;
  currentAdminId: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  quickRepliesRef: React.RefObject<HTMLDivElement | null>;
  scrollQuickReplies: (direction: 'left' | 'right') => void;
  quickReplies: string[];
  setReplyText: (text: string) => void;
  formatMsgTime: (createdAt: any) => string;
  getMessageDateString: (msg: MessageData) => string;
  formatSeparatorDate: (dateStr: string) => string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeRoom,
  allMessages,
  isCustomerTyping,
  replyText,
  onReplyTextChange,
  onSend,
  onClaimRoom,
  onCloseRoom,
  currentAdminId,
  messagesEndRef,
  quickRepliesRef,
  scrollQuickReplies,
  quickReplies,
  setReplyText,
  formatMsgTime,
  getMessageDateString,
  formatSeparatorDate,
}) => {
  return (
    <Col span={16} className="h-full flex flex-col">
      {activeRoom ? (
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
                onClick={() => onCloseRoom(activeRoom.id)}
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
              <div ref={messagesEndRef as any} />
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
                  onClick={() => onClaimRoom(activeRoom.id)}
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
                  ref={quickRepliesRef as any}
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
              <form onSubmit={onSend} className="flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn trả lời khách hàng..."
                  value={replyText}
                  onChange={onReplyTextChange}
                  className="flex-1 rounded-lg"
                  onPressEnter={onSend}
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
                    onClick={() => onClaimRoom(activeRoom.id)}
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
  );
};

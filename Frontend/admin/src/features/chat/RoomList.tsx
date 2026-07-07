import React from 'react';
import { Card, Col, List, Avatar, Badge, Spin, Typography, Segmented, DatePicker } from 'antd';
import { UserOutlined, MessageOutlined } from '@ant-design/icons';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Text } = Typography;

export interface ChatRoom {
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

interface RoomListProps {
  chatRooms: ChatRoom[];
  filteredRooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  activeTab: 'mine' | 'all';
  onTabChange: (tab: 'mine' | 'all') => void;
  filterDate: any;
  onFilterDateChange: (date: any) => void;
  loadingRooms: boolean;
  mineUnreadCount: number;
  allUnreadCount: number;
  currentAdminId: string;
}

const getDisplayName = (name: string, email: string) => {
  if (name && name.startsWith('Guest (')) {
    return email || name.replace('Guest (', '').replace(')', '');
  }
  return name;
};

export const RoomList: React.FC<RoomListProps> = ({
  filteredRooms,
  activeRoomId,
  onSelectRoom,
  activeTab,
  onTabChange,
  filterDate,
  onFilterDateChange,
  loadingRooms,
  mineUnreadCount,
  allUnreadCount,
  currentAdminId,
}) => {
  return (
    <Col span={8} className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <DatePicker
          placeholder="Lọc theo ngày..."
          value={filterDate}
          onChange={onFilterDateChange}
          className="w-full rounded-lg"
          locale={locale}
          format="DD/MM/YYYY"
        />
      </div>

      <Segmented
        block
        value={activeTab}
        onChange={(value: any) => onTabChange(value)}
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
          // Skeleton Room List Items
          <div className="flex flex-col gap-4 p-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100/60">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 bg-gray-200 rounded w-[45%]"></div>
                  <div className="h-3 bg-gray-150 rounded w-[75%] mt-2.5"></div>
                </div>
                <div className="w-8 h-3 bg-gray-200 rounded shrink-0 self-start mt-0.5"></div>
              </div>
            ))}
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
                  onClick={() => onSelectRoom(room.id)}
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
  );
};

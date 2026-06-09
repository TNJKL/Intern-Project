import React from 'react';
import { Card, Row, Col, List, Avatar, Input, Button, Badge } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';

const ChatWindow: React.FC = () => {
  const users = [
    { id: 1, name: 'Nguyễn Văn A', lastMsg: 'Cà phê ngon quá!', time: '10:30', unread: 2 },
    { id: 2, name: 'Trần Thị B', lastMsg: 'Shop cho mình hỏi...', time: '11:15', unread: 0 },
    { id: 3, name: 'Lê Văn C', lastMsg: 'Đã nhận được hàng.', time: '09:45', unread: 0 },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col">
      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6">Trung tâm Hỗ trợ Chat</h2>
      
      <Row gutter={16} className="flex-1 overflow-hidden">
        {/* User List */}
        <Col span={8} className="h-full">
          <Card variant="borderless" className="h-full shadow-sm overflow-auto" styles={{ body: { padding: 0 } }}>
            <List
              itemLayout="horizontal"
              dataSource={users}
              renderItem={(user) => (
                <List.Item className="!pl-6 pr-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} className="bg-[#8c6239]" />}
                    title={
                      <div className="flex justify-between items-center pr-4">
                        <span className="font-bold">{user.name}</span>
                        <span className="text-[10px] text-gray-400">{user.time}</span>
                      </div>
                    }
                    description={
                      <div className="flex justify-between items-center mt-1 pr-4">
                        <span className="text-xs text-gray-500 truncate w-36">{user.lastMsg}</span>
                        {user.unread > 0 && <Badge count={user.unread} />}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Chat Area */}
        <Col span={16} className="h-full flex flex-col">
          <Card variant="borderless" className="flex-1 shadow-sm mb-4 overflow-auto bg-[#fdfaf5]/30">
            <div className="flex flex-col gap-4">
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm max-w-md border border-gray-100">
                  <p className="text-sm">Shop ơi, mình muốn hỏi về đơn hàng #ORD-001</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#8c6239] text-white p-3 rounded-2xl rounded-br-none shadow-sm max-w-md">
                  <p className="text-sm text-white">Chào bạn, shop đã nhận được yêu cầu của bạn. Bạn đợi một chút nhé!</p>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="borderless" className="shadow-sm" styles={{ body: { padding: 12 } }}>
            <div className="flex gap-2">
              <Input placeholder="Nhập tin nhắn trả lời khách hàng..." className="flex-1 rounded-lg" />
              <Button type="primary" style={{ backgroundColor: '#8c6239' }} icon={<SendOutlined />} className="rounded-lg h-auto" />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChatWindow;

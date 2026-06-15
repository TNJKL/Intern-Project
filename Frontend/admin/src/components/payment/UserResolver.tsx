import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { Tooltip, Spin, Typography } from 'antd';

const { Text } = Typography;

interface UserResolverProps {
  userId?: string;
  fallbackText?: string;
}

export const UserResolver: React.FC<UserResolverProps> = ({ userId, fallbackText = 'Khách vãng lai' }) => {
  const { data: userRes, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
  });

  if (!userId) {
    return <Text type="secondary">{fallbackText}</Text>;
  }

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (error || !userRes || !userRes.data) {
    // Return fallback with shortened ID if cannot load
    return (
      <Tooltip title={`ID: ${userId}`}>
        <Text type="secondary" code>{userId.substring(0, 8)}...</Text>
      </Tooltip>
    );
  }

  const user = userRes.data;
  return (
    <Tooltip title={`ID: ${userId} | SĐT: ${user.phone || 'Không có'}`}>
      <span className="font-semibold text-gray-800">{user.fullName || user.email || 'Không tên'}</span>
      {user.email && <div className="text-[10px] text-gray-400 font-normal leading-tight">{user.email}</div>}
    </Tooltip>
  );
};

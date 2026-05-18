import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface ManagementHeaderProps {
  title: string;
  description: string;
  addButtonText: string;
  onAdd: () => void;
  isLoading?: boolean;
}

export const ManagementHeader: React.FC<ManagementHeaderProps> = ({
  title, description, addButtonText, onAdd, isLoading
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div>
      <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{title}</h2>
      <p className="text-gray-500 font-medium mt-1">{description}</p>
    </div>
    <Button
      type="primary"
      size="large"
      icon={<PlusOutlined />}
      className="bg-gray-800 hover:bg-black rounded-xl font-bold px-6 shadow-md"
      onClick={onAdd}
      loading={isLoading}
    >
      {addButtonText}
    </Button>
  </div>
);

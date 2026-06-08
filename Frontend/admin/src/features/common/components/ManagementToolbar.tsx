import React from 'react';
import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface ManagementToolbarProps {
  searchText: string;
  setSearchText: (text: string) => void;
  includeDeleted: boolean;
  setIncludeDeleted: (val: boolean) => void;
  searchPlaceholder?: string;
  extraFilters?: {
    categories?: { id: string, name: string }[];
    showStatusFilter?: boolean;
    showFeaturedFilter?: boolean;
    showDeletedFilter?: boolean;
  };
  filterStates: {
    selectedCategory: string | undefined;
    setSelectedCategory: (val: string | undefined) => void;
    availability: boolean | undefined;
    setAvailability: (val: boolean | undefined) => void;
    featured: boolean | undefined;
    setFeatured: (val: boolean | undefined) => void;
    sortBy: string | undefined;
    setSortBy: (val: string | undefined) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (val: 'asc' | 'desc') => void;
  };
}

export const ManagementToolbar: React.FC<ManagementToolbarProps> = ({
  searchText, setSearchText,
  searchPlaceholder, extraFilters, filterStates
}) => (
  <div className="flex flex-col gap-6 mb-8">
    <div className="flex justify-between items-center bg-white/50 p-2 rounded-2xl border border-gray-100/50 backdrop-blur-md">
      <Input
        placeholder={searchPlaceholder || "Tìm kiếm..."}
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        className="w-full max-w-md rounded-xl border-none bg-transparent hover:bg-white focus:bg-white transition-all h-11 text-sm"
      />
    </div>

    <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
      {extraFilters?.categories && (
        <Select
          placeholder="Chọn danh mục"
          allowClear
          className="custom-select-admin w-full sm:w-[180px]"
          placement="bottomLeft"
          listHeight={250}
          getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          onChange={value => filterStates.setSelectedCategory(value)}
          options={[
            { label: 'Tất cả danh mục', value: undefined },
            ...extraFilters.categories.map(c => ({ label: c.name, value: c.id }))
          ]}
        />
      )}

      {extraFilters?.showStatusFilter && (
        <Select
          placeholder="Trạng thái bán"
          allowClear
          className="custom-select-admin w-full sm:w-[150px]"
          placement="bottomLeft"
          onChange={value => filterStates.setAvailability(value)}
          options={[
            { label: 'Tất cả trạng thái', value: undefined },
            { label: 'Đang bán', value: true },
            { label: 'Ngừng bán', value: false }
          ]}
        />
      )}

      {extraFilters?.showFeaturedFilter && (
        <Select
          placeholder="Nổi bật"
          allowClear
          className="custom-select-admin w-full sm:w-[140px]"
          placement="bottomLeft"
          onChange={value => filterStates.setFeatured(value)}
          options={[
            { label: 'Tất cả', value: undefined },
            { label: 'Nổi bật', value: true },
            { label: 'Bình thường', value: false }
          ]}
        />
      )}

      <Select
        placeholder="Sắp xếp theo"
        className="custom-select-admin w-full sm:w-[180px]"
        placement="bottomLeft"
        value={(filterStates.sortBy || 'displayOrder') + (filterStates.sortDirection === 'desc' ? '_desc' : '_asc')}
        onChange={(val: string) => {
          const [field, dir] = val.split('_');
          filterStates.setSortBy(field);
          filterStates.setSortDirection(dir as 'asc' | 'desc');
        }}
        options={[
          { label: 'Mặc định', value: 'displayOrder_asc' },
          { label: 'Từ: A-Z', value: 'name_asc' },
          { label: 'Từ: Z-A', value: 'name_desc' },
          { label: 'Mới nhất', value: 'createdAt_desc' },
        ]}
      />

    </div>
  </div>
);

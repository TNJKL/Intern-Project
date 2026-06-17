import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/lib/antd';

interface ManagementService<T> {
  getAll: (params: any) => Promise<any>;
  getById: (id: string) => Promise<T>;
  create: (data: any) => Promise<T>;
  update: (id: string, data: any) => Promise<T>;
  delete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
}

export const useManagement = <T extends { id: string }>(
  queryKey: string,
  service: ManagementService<T>,
  includeDeletedDefault: boolean = false
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters State
  const [includeDeleted, setIncludeDeleted] = useState(includeDeletedDefault);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<boolean | undefined>(undefined);
  const [featured, setFeatured] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const queryClient = useQueryClient();

  // Helper to reset page when filters change
  const handleFilterChange = (setter: any) => (val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  const isDeletedRecord = (r: any) => {
    const isDeleted = !!(r.isDeleted || r.deleted || r.deletedAt || r.status === 'DELETED');
    const isNotAvailable = r.isAvailable === false;
    const isNotActive = r.isActive === false;
    return isDeleted || isNotAvailable || isNotActive;
  };

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, includeDeleted],
    queryFn: () => service.getAll({ 
      page: 0, 
      size: 1000, 
      includeDeleted: includeDeleted,
    }),
  });

  const rawRecords = (() => {
    if (!data) return [];
    const raw = Array.isArray(data) ? data : (data.data || data.records || []);
    return Array.isArray(raw) ? raw : [];
  })();

  // 1. Lọc theo trạng thái xóa mềm
  let records = includeDeleted 
    ? rawRecords.filter(isDeletedRecord) 
    : rawRecords.filter((r: any) => !isDeletedRecord(r));

  // 2. Lọc theo danh mục (Category)
  if (selectedCategory) {
    records = records.filter((r: any) => r.categoryId === selectedCategory);
  }

  // 3. Lọc theo trạng thái bán (Availability)
  if (availability !== undefined) {
    records = records.filter((r: any) => r.isAvailable === availability);
  }

  // 4. Lọc theo nổi bật (Featured)
  if (featured !== undefined) {
    records = records.filter((r: any) => r.isFeatured === featured);
  }

  // 5. Lọc theo từ khóa tìm kiếm (Search keyword)
  if (searchText && searchText.trim() !== '') {
    const kw = searchText.toLowerCase().trim();
    records = records.filter((r: any) => {
      const nameMatch = r.name && r.name.toLowerCase().includes(kw);
      const descMatch = r.description && r.description.toLowerCase().includes(kw);
      const skuMatch = r.sku && r.sku.toLowerCase().includes(kw);
      const codeMatch = r.code && r.code.toLowerCase().includes(kw);
      return nameMatch || descMatch || skuMatch || codeMatch;
    });
  }

  // 6. Sắp xếp chuỗi tiếng Việt chuẩn bằng localeCompare
  const activeSortBy = sortBy || 'displayOrder';
  records = [...records].sort((a: any, b: any) => {
    let valA = a[activeSortBy];
    let valB = b[activeSortBy];

    // Xử lý null/undefined
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    // Sắp xếp chuỗi tiếng Việt chuẩn
    if (typeof valA === 'string' && typeof valB === 'string') {
      const comparison = valA.localeCompare(valB, 'vi', { sensitivity: 'accent' });
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Mặc định cho số / ngày tháng
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalElements = records.length;

  const createMutation = useMutation({
    mutationFn: service.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      message.success('Tạo thành công!');
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string, data: any }) => service.update(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      message.success('Cập nhật thành công!');
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: service.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      message.success('Đã chuyển vào thùng rác!');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: service.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      message.success('Đã khôi phục thành công!');
    }
  });

  return {
    state: {
      isModalOpen, setIsModalOpen,
      editingRecord, setEditingRecord,
      searchText, setSearchText: handleFilterChange(setSearchText),
      currentPage, setCurrentPage,
      pageSize, setPageSize,
      includeDeleted, setIncludeDeleted: handleFilterChange(setIncludeDeleted),
      selectedCategory, setSelectedCategory: handleFilterChange(setSelectedCategory),
      availability, setAvailability: handleFilterChange(setAvailability),
      featured, setFeatured: handleFilterChange(setFeatured),
      sortBy, setSortBy: handleFilterChange(setSortBy),
      sortDirection, setSortDirection: handleFilterChange(setSortDirection)
    },
    data: { records, isLoading, totalElements },
    actions: { createMutation, updateMutation, deleteMutation, restoreMutation }
  };
};

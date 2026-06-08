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

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, currentPage, pageSize, searchText, includeDeleted, selectedCategory, availability, featured, sortBy, sortDirection],
    queryFn: () => service.getAll({ 
      page: currentPage - 1, 
      size: pageSize, 
      keyword: searchText,
      includeDeleted: includeDeleted,
      categoryId: selectedCategory,
      isAvailable: availability,
      isFeatured: featured,
      sortBy: sortBy,
      sortDirection: sortDirection
    }),
  });

  const rawRecords = Array.isArray(data) ? data : (data?.data || []);
  let records = includeDeleted 
    ? rawRecords 
    : rawRecords.filter((r: any) => !(r.isDeleted || r.deleted || r.deletedAt || r.status === 'DELETED'));

  // Client-side sorting fallback to ensure UI correctness
  if (sortBy && records.length > 0) {
    records = [...records].sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle null/undefined
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      // Special handling for strings (like names)
      if (typeof valA === 'string' && typeof valB === 'string') {
        const comparison = valA.localeCompare(valB, 'vi', { sensitivity: 'accent' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Default numeric/other comparison
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalElements = Array.isArray(data) ? rawRecords.length : (data?.totalElements || rawRecords.length);

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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherService, type VoucherFormData } from '@/services/voucherService';
import { message } from '@/lib/antd';

export const useVouchers = () => {
  const queryClient = useQueryClient();

  const vouchersQuery = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const response = await voucherService.getVouchers();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: VoucherFormData) => voucherService.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      message.success('Tạo khuyến mãi thành công');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Lỗi khi tạo khuyến mãi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VoucherFormData }) => 
      voucherService.updateVoucher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      message.success('Cập nhật khuyến mãi thành công');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Lỗi khi cập nhật khuyến mãi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => voucherService.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      message.success('Xóa khuyến mãi thành công');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Lỗi khi xóa khuyến mãi');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => voucherService.toggleVoucherStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      message.success('Cập nhật trạng thái thành công');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    },
  });

  return {
    vouchers: vouchersQuery.data?.data || [],
    isLoading: vouchersQuery.isLoading,
    isError: vouchersQuery.isError,
    createVoucher: createMutation,
    updateVoucher: updateMutation,
    deleteVoucher: deleteMutation,
    toggleStatus: toggleStatusMutation,
  };
};

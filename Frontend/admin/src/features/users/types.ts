import type { User, UserPayload } from '@/types/user';

export interface UserTableProps {
  loading: boolean;
  dataSource: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onView: (user: User) => void;
}

export interface UserModalProps {
  isOpen: boolean;
  editingUser: User | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: (payload: UserPayload) => void;
}

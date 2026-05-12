import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

// Khởi tạo các object "rỗng" để export ngay lập tức
// Chúng sẽ được lấp đầy bằng các hàm thực tế khi AntdStaticHelper render
export const message: MessageInstance = {} as any;
export const notification: NotificationInstance = {} as any;
export const modal: ModalStaticFunctions = {} as any;

/**
 * Component này dùng để "bắt" lấy các instance của message, notification, modal 
 * từ trong context của App (Ant Design) và đưa ra ngoài để dùng ở bất cứ đâu.
 */
export const AntdStaticHelper = () => {
  const staticFunctions = App.useApp();
  
  // Gán đè các hàm vào object đã export
  Object.assign(message, staticFunctions.message);
  Object.assign(notification, staticFunctions.notification);
  Object.assign(modal, staticFunctions.modal);
  
  return null;
};

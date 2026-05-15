import { getServerApi } from "@/lib/server-api";
import ProfileClient from "./components/ProfileClient";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const metadata = {
  title: "Hồ sơ cá nhân | Brewtra Coffee",
  description: "Quản lý thông tin cá nhân và tài khoản Brewtra của bạn.",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasRefreshToken = allCookies.some(c => 
    c.name.toLowerCase().includes('refresh') || 
    c.name.toLowerCase().includes('token')
  );

  // Nếu không có bất kỳ dấu hiệu nào của token (dù là refresh hay access cũ), mới redirect
  if (!hasRefreshToken) {
    redirect("/login");
  }

  let user = null;
  let shouldRedirect = false;

  try {
    const response = await getServerApi('/api/v1/auth/me');
    
    // Nếu hết token, server-api trả về { success: false, message: 'Unauthorized' } chứ không throw
    if (!response || response.success === false || response.message === 'Unauthorized') {
      shouldRedirect = true;
    } else {
      user = response.data || response;
      // Đảm bảo là user thật
      if (!user || !user.id) {
        shouldRedirect = true;
      }
    }
  } catch (error) {
    console.error("Error fetching profile on server:", error);
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    redirect("/login");
  }

  return <ProfileClient user={user} />;
}

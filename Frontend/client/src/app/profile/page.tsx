import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import ProfileClient from "./components/ProfileClient";
import { getServerApi } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân | Brewtra Coffee",
  description: "Quản lý thông tin tài khoản và hồ sơ cá nhân của bạn tại Brewtra Coffee.",
};

export default async function ProfilePage() {
  let user = null;
  let isServerError = false;

  const cookieStore = await cookies();
  const hasRefreshToken = cookieStore.has("refreshToken");

  try {
    const response = await getServerApi("/api/v1/auth/me");
    if (response?.success && response?.data) {
      user = response.data;
    } else if (response === null) {
      isServerError = true;
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin người dùng:", error);
    isServerError = true;
  }

  // Nếu không tải được thông tin VÀ không có cả refreshToken (chưa đăng nhập) -> redirect ngay lập tức.
  // Nếu có refreshToken nhưng API lỗi (hết hạn accessToken), Client Component sẽ tự phục hồi ngầm.
  if (!user && !hasRefreshToken) {
    redirect("/login");
  }

  return <ProfileClient initialUser={user} isServerError={isServerError} />;
}

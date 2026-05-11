import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "@/styles/globals.css";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Toaster } from "react-hot-toast";
import { ReduxProvider } from "@/providers/ReduxProvider";

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Brewtra Coffee - Hương vị nguyên bản",
  description: "Trải nghiệm cà phê tuyệt hảo từ những hạt cà phê tuyển chọn nhất.",
};

import { getServerApi } from "@/lib/server-api";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    // Thử lấy thông tin user trên server
    const response = await getServerApi('/api/v1/auth/me');
    user = response.data || response;
  } catch (error) {
    // Nếu lỗi (chưa login) thì user = null, không cần redirect ở đây
    user = null;
  }

  return (
    <html lang="vi">
      <body className={`${quicksand.variable} font-sans antialiased`}>
        <ReduxProvider>
          <CustomerLayout initialUser={user}>
            {children}
          </CustomerLayout>
          <Toaster position="top-right" />
        </ReduxProvider>
      </body>
    </html>
  );
}

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

// Hỗ trợ safe area (iPhone notch / home indicator) cho bottom nav
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user || null;

  return (
    <html lang="vi">
      <body className={`${quicksand.variable} font-sans antialiased`}>
        <SessionProvider session={session}>
          <ReduxProvider>
            <CustomerLayout initialUser={user}>
              {children}
            </CustomerLayout>
            <Toaster position="top-right" />
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

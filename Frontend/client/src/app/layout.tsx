import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "@/styles/globals.css";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Toaster } from "react-hot-toast";

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Brewtra Coffee - Hương vị nguyên bản",
  description: "Trải nghiệm cà phê tuyệt hảo từ những hạt cà phê tuyển chọn nhất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${quicksand.variable} font-sans antialiased`}>
        <CustomerLayout>
          {children}
        </CustomerLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

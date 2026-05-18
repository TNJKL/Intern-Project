import { Metadata } from "next";
import OffersClient from "./components/OffersClient";
import { getServerApi } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Ưu đãi | Brewtra Coffee",
  description: "Khám phá danh sách mã giảm giá và chương trình khuyến mãi hấp dẫn tại Brewtra Coffee.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OffersPage() {
  let vouchers = [];
  try {
    const res = await getServerApi('/api/v1/admin/vouchers');
    if (res?.success && res?.data) {
      vouchers = res.data;
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách voucher trên Server:", error);
  }

  return <OffersClient initialVouchers={vouchers} />;
}

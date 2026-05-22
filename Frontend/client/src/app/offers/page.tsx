import { Metadata } from "next";
import OffersClient from "./components/OffersClient";
import { getServerApi } from "@/lib/server-api";
import { FALLBACK_VOUCHERS } from "@/services/voucher.service";

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
    } else {
      // Thử gọi api public nếu admin lỗi
      const pubRes = await getServerApi('/api/v1/vouchers').catch(() => null);
      if (pubRes?.success && pubRes?.data) {
        vouchers = pubRes.data;
      } else {
        vouchers = FALLBACK_VOUCHERS;
      }
    }
  } catch (error) {
    console.warn("Lỗi khi tải danh sách voucher trên Server (sử dụng fallback):", error);
    vouchers = FALLBACK_VOUCHERS;
  }

  return <OffersClient initialVouchers={vouchers} />;
}

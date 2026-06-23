import { Metadata } from "next";
import OffersClient from "./components/OffersClient";
import { auth } from "@/auth";
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
    const res = await getServerApi('/api/v1/admin/vouchers?size=100');
    if (res?.success && res?.data) {
      vouchers = res.data;
    } else {
      vouchers = FALLBACK_VOUCHERS;
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách voucher từ Server:", error);
    vouchers = FALLBACK_VOUCHERS;
  }

  return <OffersClient initialVouchers={vouchers} />;
}


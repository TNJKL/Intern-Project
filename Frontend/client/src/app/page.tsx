import { Categories } from "@/components/home/Categories";
import { ProductList } from "@/components/product/ProductList";
import { Features } from "@/components/home/Features";
import { AboutUs } from "@/components/home/AboutUs";

export default function Home() {
  return (
    <div className="relative">
      {/* Sleek Welcome Header */}
      <section className="pt-16 md:pt-24 pb-8 px-6 max-w-4xl mx-auto w-full text-center relative z-10">
        <span className="text-primary font-black text-xs md:text-sm uppercase tracking-[0.3em] mb-4 block">Khơi nguồn cảm hứng</span>
        <h1 className="text-5xl md:text-7xl font-black text-coffee-dark uppercase tracking-tighter leading-[0.9] mb-6">
          Nghệ Thuật<br/><span className="text-primary">Cà Phê</span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto font-medium leading-relaxed text-sm md:text-base">
          Đánh thức mọi giác quan của bạn với những hạt cà phê tuyển chọn và sự tinh tế trong từng giọt pha chế. Khám phá thực đơn đặc biệt của chúng tôi ngay hôm nay.
        </p>
      </section>

      <Categories />
      <ProductList />
      <AboutUs />
      <Features />
      
      {/* Background blobs for aesthetic */}
      <div className="absolute top-0 left-1/2 -z-10 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/3 right-0 -z-10 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full translate-x-1/3"></div>
    </div>
  );
}

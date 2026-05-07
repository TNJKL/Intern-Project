import { Categories } from "@/components/home/Categories";
import { ProductList } from "@/components/product/ProductList";
import { Features } from "@/components/home/Features";
import { AboutUs } from "@/components/home/AboutUs";
import { Hero } from "@/components/home/Hero";

export default function Home() {
  return (
    <div className="relative">
      <Hero />

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

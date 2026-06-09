import { Coffee, Leaf, ShieldCheck, Clock } from "lucide-react";

const features = [
  {
    icon: Coffee,
    title: "100% Nguyên Chất",
    description: "Hạt cà phê được tuyển chọn kỹ lưỡng từ những vùng trồng tốt nhất."
  },
  {
    icon: Leaf,
    title: "Hương Vị Tự Nhiên",
    description: "Không sử dụng chất bảo quản hay hương liệu nhân tạo."
  },
  {
    icon: ShieldCheck,
    title: "Chất Lượng Cao",
    description: "Quy trình rang xay đạt chuẩn, giữ trọn vẹn hương vị."
  },
  {
    icon: Clock,
    title: "Giao Hàng Nhanh",
    description: "Cà phê luôn nóng hổi và thơm ngon khi đến tay bạn."
  }
];

export function Features() {
  return (
    <section className="px-6 py-16 max-w-7xl mx-auto w-full">
      <div className="bg-coffee-dark rounded-[40px] p-8 md:p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/30 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-accent/20 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="bg-primary/20 p-3 rounded-2xl text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-wider text-sm mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

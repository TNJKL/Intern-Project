import Image from "next/image";

export function AboutUs() {
  return (
    <section id="about" className="px-6 py-24 max-w-7xl mx-auto w-full scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Images Grid */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 translate-y-8">
              <div className="relative h-48 md:h-64 w-full rounded-[32px] overflow-hidden shadow-lg">
                <Image src="/images/about-beans.jpg" alt="Coffee beans" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              </div>
              <div className="relative h-32 md:h-48 w-full rounded-[32px] overflow-hidden shadow-lg">
                <Image src="/images/about-pouring.jpg" alt="Barista pouring coffee" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative h-64 md:h-80 w-full rounded-[32px] overflow-hidden shadow-lg">
                <Image src="/images/about-interior.jpg" alt="Coffee shop interior" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              </div>
              <div className="relative h-40 md:h-48 w-full rounded-[32px] bg-coffee-dark p-6 flex flex-col justify-center text-white">
                <h4 className="text-4xl font-black mb-2">10+</h4>
                <p className="text-sm text-white/70 font-medium">Năm kinh nghiệm<br/>rang xay cà phê</p>
              </div>
            </div>
          </div>
          {/* Decorative blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[80px] -z-10"></div>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col items-start text-left">
          <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Về Chúng Tôi</span>
          <h2 className="text-4xl md:text-5xl font-black text-coffee-dark uppercase tracking-tighter leading-tight mb-6">
            Hương Vị<br/><span className="text-primary/40">Nguyên Bản</span>
          </h2>
          <p className="text-gray-500 leading-relaxed mb-6">
            Ra đời từ tình yêu mãnh liệt với hạt cà phê Việt, Brewtra không chỉ là một quán cà phê, mà là nơi tôn vinh những giá trị nguyên bản. Chúng tôi tự hào mang đến cho bạn trải nghiệm thưởng thức cà phê trọn vẹn nhất, từ nông trại đến tách cà phê trên tay bạn.
          </p>
          <p className="text-gray-500 leading-relaxed mb-8">
            Mỗi hạt cà phê tại Brewtra đều được tuyển chọn khắt khe, rang xay thủ công và pha chế bởi những Barista đầy đam mê. Dù bạn cần một ly Espresso đậm đà để đánh thức ngày mới, hay một cốc Cold Brew thanh mát cho buổi chiều thư thả, chúng tôi luôn có mặt để phục vụ.
          </p>
          <button className="bg-coffee-dark text-white px-8 py-4 rounded-full font-bold hover:bg-primary transition-colors shadow-lg shadow-coffee-dark/20 active:scale-95">
            Tìm hiểu thêm
          </button>
        </div>
      </div>
    </section>
  );
}

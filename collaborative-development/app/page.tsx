import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full bg-white">
      {/* Navbar */}
      <nav className="flex flex-row items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto w-full gap-4">
        <Link href="/" className="flex items-center gap-4 flex-shrink-0 group">
          <div className="relative w-16 h-16 md:w-20 md:h-20 transition-transform group-hover:scale-110 duration-300">
            <Image
              src="/assets/logo.png"
              alt="GoGodam Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl md:text-3xl font-bold text-primary tracking-tighter">GoGodam</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-10 font-bold text-sm md:text-lg whitespace-nowrap">
          <Link href="/login" className="hover:text-primary transition-colors py-2 px-1">Login</Link>
          <Link href="/signup" className="hover:text-primary transition-colors py-2 px-1">Signup</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-12 md:pt-24 pb-20 md:pb-32 text-center px-6 relative w-full overflow-hidden">
        <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[100px] font-bold leading-[0.95] md:leading-[0.9] tracking-tighter mb-8 md:mb-10 max-w-5xl break-words">
          <span className="text-primary block mb-1 md:mb-2">Inventory</span>
          <span className="text-foreground">System&Logistics</span>
        </h1>
        <div className="relative z-10">
          <Link
            href="/signup"
            className="bg-primary hover:bg-[#4d00cc] text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-bold text-base md:text-xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 inline-block"
          >
            Start now - it's free
          </Link>

          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 z-0 hidden md:block animate-bounce opacity-80">
            <Image
              src="/assets/grey_arrow_md_04.svg"
              alt="Arrow pointing down"
              width={40} height={90}
            />
          </div>
        </div>

        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-5 pointer-events-none">
          <div className="w-[120%] h-[120%] bg-primary rounded-full blur-[120px] -translate-x-10"></div>
        </div>
      </section>

      {/* Seamless Continuity Section */}
      <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center mb-16 md:mb-28">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tighter leading-[1.1] max-w-3xl mb-6 md:mb-10">
            <span className="text-primary">Seamless</span> Continuity
          </h2>
          <p className="text-base md:text-xl text-zinc-600 max-w-4xl leading-relaxed font-medium px-2">
            Keep your shelves stocked and your production lines moving with GoGodam's intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds, Make-to-Order (MTO) workflows, or a Master Production Schedule to eliminate stockouts entirely.
          </p>
        </div>

        {/* Illustrations Grid */}
        <div className="bg-[#f8f9fb] border border-zinc-100/50 rounded-[40px] md:rounded-[64px] p-10 md:p-20 flex flex-col md:flex-row items-center justify-center gap-16 md:gap-6 relative text-center w-full shadow-sm">
          <div className="flex flex-col items-center space-y-6 md:w-1/3 z-10 group">
            <div className="h-32 md:h-40 flex items-center justify-center bg-white p-6 rounded-[32px] shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/assets/blue_truck.svg" alt="Replenishment" width={110} height={110} className="w-auto h-24 md:h-28 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
            </div>
            <p className="font-serif font-bold text-2xl md:text-3xl text-foreground">Replenishment</p>
          </div>

          <div className="hidden lg:block w-6 relative z-0 flex-shrink-0 opacity-80 -rotate-90">
            <Image src="/assets/arrow_dot_02.svg" alt="Path arrow" width={20} height={60} className="w-full h-auto" />
          </div>

          <div className="flex flex-col items-center space-y-6 md:w-1/3 z-10 group">
            <div className="h-40 md:h-48 flex items-center justify-center bg-white p-6 rounded-[32px] shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/assets/yellow_shield_2.svg" alt="Quality Control" width={110} height={110} className="w-auto h-28 md:h-32 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
            </div>
            <p className="font-serif font-bold text-2xl md:text-3xl text-foreground">Quality Control</p>
          </div>

          <div className="hidden lg:block w-6 relative z-0 flex-shrink-0 opacity-80 -rotate-90">
            <Image src="/assets/arrow_dot_02.svg" alt="Path arrow" width={20} height={60} className="w-full h-auto" />
          </div>

          <div className="flex flex-col items-center space-y-6 md:w-1/3 z-10 group">
            <div className="h-32 md:h-40 flex items-center justify-center bg-white p-6 rounded-[32px] shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/assets/hand-truch.svg" alt="Storage" width={110} height={110} className="w-auto h-24 md:h-28 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
            </div>
            <p className="font-serif font-bold text-2xl md:text-3xl text-foreground">Storage</p>
          </div>
        </div>
      </section>

      {/* Optimize Section */}
      <section className="py-12 md:py-24 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 md:gap-20 overflow-hidden">
        <div className="flex-1 space-y-6 md:space-y-10 text-center lg:text-left relative z-10">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tighter leading-[1] max-w-xl mx-auto lg:mx-0">
            <span className="text-primary block lg:inline mb-2 lg:mb-0">Optimize</span> your warehouse
          </h2>
          <p className="text-base md:text-xl text-zinc-600 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
            Keep your shelves stocked and your production lines moving with GoGodam's intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds, Make-to-Order (MTO) workflows, or a Master Production Schedule.
          </p>
          <div className="absolute -top-10 -left-10 opacity-10 hidden lg:block select-none pointer-events-none">
            <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={100} height={100} />
          </div>
        </div>

        <div className="flex-1 relative w-full px-0 sm:px-6">
          <div className="bg-[#f0f2f5] rounded-[48px] md:rounded-[64px] aspect-video flex-grow flex items-center justify-center w-full relative group shadow-inner border border-zinc-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-3xl md:text-5xl italic font-serif opacity-30 group-hover:opacity-60 transition-all text-foreground group-hover:scale-110 duration-700">screen shot</span>

            <div className="absolute -bottom-8 md:-bottom-12 -right-4 md:-right-8 w-28 md:w-44 h-28 md:h-44 z-20">
              <Image src="/assets/yellow_unbox.svg" alt="Unboxing Icon" fill className="object-contain drop-shadow-2xl group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-700 delay-100" />
            </div>

            <div className="absolute top-10 right-10 opacity-10 group-hover:scale-150 transition-transform duration-1000">
              <Image src="/assets/grey_arrow_loop_01.svg" alt="Loop" width={80} height={80} />
            </div>
          </div>
        </div>
      </section>

      {/* One Need Section */}
      <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tighter mb-20 md:mb-32 leading-tight">
          <span className="text-primary">One</span> need, one site.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24 md:gap-16 lg:gap-24">
          <div className="flex flex-col items-center group">
            <div className="h-48 md:h-64 flex items-center justify-center mb-6">
              <Image src="/assets/Gemini_Generated_Image_3he0nh3he0nh3he0-Photoroom.png" alt="Sales" width={240} height={240} className="object-contain drop-shadow-lg w-auto h-44 md:h-56 group-hover:scale-110 transition-all duration-500" />
            </div>
            <p className="font-caveat font-bold text-4xl md:text-5xl text-primary italic">Sales</p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="h-48 md:h-64 flex items-center justify-center mb-6">
              <Image src="/assets/Gemini_Generated_Image_g19kejg19kejg19k-Photoroom.png" alt="Tracking" width={240} height={240} className="object-contain drop-shadow-lg w-auto h-44 md:h-56 group-hover:scale-110 transition-all duration-500" />
            </div>
            <p className="font-caveat font-bold text-4xl md:text-5xl text-primary italic">Tracking</p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="h-48 md:h-64 flex items-center justify-center mb-6">
              <Image src="/assets/Gemini_Generated_Image_soedpzsoedpzsoed-Photoroom.png" alt="Inventory" width={240} height={240} className="object-contain drop-shadow-lg w-auto h-44 md:h-56 group-hover:scale-110 transition-all duration-500" />
            </div>
            <p className="font-caveat font-bold text-4xl md:text-5xl text-primary italic">Inventory</p>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-20 md:py-32 flex flex-col items-center justify-center text-center px-6 relative max-w-5xl mx-auto w-full overflow-visible">
        <div className="absolute top-10 left-0 md:left-10 opacity-20 select-none pointer-events-none hidden sm:block">
          <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={100} height={100} className="rotate-[-15deg] opacity-60" />
        </div>
        <div className="absolute top-0 right-0 md:right-10 opacity-20 select-none pointer-events-none hidden sm:block">
          <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={120} height={120} className="scale-x-[-1] rotate-[15deg] opacity-60" />
        </div>

        <h2 className="text-7xl md:text-[120px] font-bold tracking-tighter mb-12 z-10 leading-none">
          <span className="text-primary mr-4">Join</span>
          <span className="text-[#1e004b]">us</span>
        </h2>
        
        <div className="flex flex-col items-center gap-8 z-10">
          <Link
            href="/signup"
            className="bg-primary hover:bg-[#4d00cc] text-white px-12 md:px-20 py-5 md:py-7 rounded-full font-bold text-xl md:text-2xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            Start now - It's free
          </Link>
          <p className="text-sm md:text-base font-medium text-zinc-500">or continue with</p>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="bg-[#1e004b] text-white pt-24 pb-8 flex flex-col items-center relative overflow-hidden">
        <div className="mb-10 z-10">
          <Image
            src="/assets/white logo.png"
            alt="GoGodam White Logo"
            width={80}
            height={80}
            className="object-contain w-16 md:w-20"
          />
        </div>

        <div className="flex flex-col items-center gap-12 z-10 w-full">
          <p className="text-sm md:text-lg font-medium opacity-90">© 2026 - GoGodam</p>
          
          <div className="w-full text-center select-none pointer-events-none mt-10">
            <h1 className="text-[18vw] font-bold tracking-tighter leading-none mb-[-2vw]">
              GoGodam
            </h1>
          </div>
        </div>
      </footer>
    </div>
  );
}

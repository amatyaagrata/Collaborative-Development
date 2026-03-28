import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex flex-col sm:flex-row items-center justify-center gap-6 px-6 md:px-12 py-8 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image 
              src="/assets/logo.png" 
              alt="GoGodam Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-black text-primary tracking-tighter">GoGodam</span>
        </Link>
        <div className="flex items-center gap-8 font-bold text-sm">
          <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          <Link href="/signup" className="hover:text-primary transition-colors">Signup</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-16 md:pt-24 pb-24 md:pb-32 text-center px-6 relative">
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-black leading-[0.9] tracking-tighter mb-10 max-w-5xl">
          <span className="text-primary block mb-2">Inventory</span>
          <span className="text-foreground">System&Logistics</span>
        </h1>
        <div className="relative">
          <Link 
            href="/signup" 
            className="bg-primary hover:bg-[#4d00cc] text-white px-8 md:px-10 py-4 md:py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-primary/20 inline-block z-10 relative"
          >
            Start now - it's free
          </Link>
          
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 z-0 hidden sm:block">
            <Image 
              src="/assets/grey_arrow_md_04.svg" 
              alt="Arrow pointing down" 
              width={24} height={60} 
              className="opacity-50"
            />
          </div>
        </div>
      </section>

      {/* Seamless Continuity Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[1.1] max-w-3xl">
            <span className="text-primary">Seamless</span> Continuity
          </h2>
          <p className="mt-6 md:mt-8 text-base md:text-lg text-zinc-600 max-w-3xl leading-relaxed font-medium">
            Keep your shelves stocked and your production lines moving with GoGodam's intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds, Make-to-Order (MTO) workflows, or a Master Production Schedule to eliminate stockouts entirely.
          </p>
        </div>

        {/* Illustrations Grid */}
        <div className="bg-[#f2f4f7] rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-4 relative text-center w-full">
          <div className="flex flex-col items-center space-y-4 md:w-1/3 z-10">
            <div className="h-32 flex items-center justify-center">
              <Image src="/assets/blue_truck.svg" alt="Replenishment" width={100} height={100} className="w-auto h-24 object-contain drop-shadow-sm hover:scale-105 transition-transform" />
            </div>
            <p className="font-serif italic font-bold text-xl md:text-2xl text-foreground">Replenishment</p>
          </div>

          <div className="hidden md:block w-32 relative z-0 flex-shrink-0">
             <Image src="/assets/arrow_dot_02.svg" alt="Path arrow" width={100} height={30} className="w-full h-auto opacity-70" />
          </div>

          <div className="flex flex-col items-center space-y-4 md:w-1/3 z-10">
            <div className="h-32 flex items-center justify-center">
              <Image src="/assets/yellow_shield_2.svg" alt="Quality Control" width={100} height={100} className="w-auto h-24 object-contain drop-shadow-sm hover:scale-105 transition-transform" />
            </div>
            <p className="font-serif italic font-bold text-xl md:text-2xl text-foreground">Quality Control</p>
          </div>

          <div className="hidden md:block w-32 relative z-0 flex-shrink-0">
             <Image src="/assets/arrow_dot_02.svg" alt="Path arrow" width={100} height={30} className="w-full h-auto opacity-70" />
          </div>

          <div className="flex flex-col items-center space-y-4 md:w-1/3 z-10">
            <div className="h-32 flex items-center justify-center">
              <Image src="/assets/hand-truch.svg" alt="Storage" width={100} height={100} className="w-auto h-24 object-contain drop-shadow-sm hover:scale-105 transition-transform" />
            </div>
            <p className="font-serif italic font-bold text-xl md:text-2xl text-foreground">Storage</p>
          </div>
        </div>
      </section>

      {/* Optimize Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        <div className="space-y-6 md:space-y-10 mb-16 relative">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[1.05]">
            <span className="text-primary">Optimize</span> your warehouse
          </h2>
          <p className="text-base md:text-lg text-zinc-600 leading-relaxed font-medium max-w-3xl">
            Keep your shelves stocked and your production lines moving with GoGodam's intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds, Make-to-Order (MTO) workflows, or a Master Production Schedule to eliminate stockouts entirely.
          </p>
          <div className="absolute -top-10 right-0 hidden lg:block opacity-30">
            <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={80} height={80} />
          </div>
        </div>

        <div className="relative w-full max-w-4xl px-4 sm:px-0">
          <div className="bg-[#f0f2f5] rounded-[40px] aspect-video flex items-center justify-center w-full relative group shadow-sm border border-zinc-100">
            <span className="text-3xl md:text-5xl italic font-serif opacity-30 group-hover:opacity-50 transition-opacity text-foreground">screen shot</span>
            <div className="absolute -bottom-10 right-4 sm:-right-8 w-24 md:w-32 h-24 md:h-32 z-20">
              <Image src="/assets/yellow_unbox.svg" alt="Unboxing Icon" fill className="object-contain drop-shadow-md hover:-translate-y-2 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* One Need Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tighter mb-16 md:mb-24 leading-tight">
          <span className="text-primary">One</span> need, one site.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-4 md:gap-12">
            <div className="flex flex-col items-center">
                <div className="h-32 md:h-40 flex items-center justify-center mb-0 md:mb-4">
                  <Image src="/assets/Gemini_Generated_Image_3he0nh3he0nh3he0-Photoroom.png" alt="Sales" width={140} height={140} className="object-contain drop-shadow-sm w-auto h-28 md:h-36 hover:scale-105 transition-transform" />
                </div>
                <p className="font-serif italic font-bold text-xl md:text-2xl text-foreground">Sales</p>
            </div>
            <div className="flex flex-col items-center">
                <div className="h-32 md:h-40 flex items-center justify-center mb-0 md:mb-4">
                  <Image src="/assets/Gemini_Generated_Image_g19kejg19kejg19k-Photoroom.png" alt="Tracking" width={140} height={140} className="object-contain drop-shadow-sm w-auto h-28 md:h-36 hover:scale-105 transition-transform" />
                </div>
                <p className="font-serif italic font-bold text-xl md:text-2xl text-foreground">Tracking</p>
            </div>
            <div className="flex flex-col items-center">
                <div className="h-32 md:h-40 flex items-center justify-center mb-0 md:mb-4">
                  <Image src="/assets/Gemini_Generated_Image_soedpzsoedpzsoed-Photoroom.png" alt="Inventory" width={140} height={140} className="object-contain drop-shadow-sm w-auto h-28 md:h-36 hover:scale-105 transition-transform" />
                </div>
                <p className="font-serif italic font-bold text-xl md:text-2xl text-foreground">Inventory</p>
            </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="pt-16 pb-32 md:py-32 flex flex-col items-center justify-center text-center px-6 relative max-w-4xl mx-auto w-full">
        <div className="absolute top-0 right-4 md:right-32 opacity-30 select-none pointer-events-none hidden sm:block">
           <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={120} height={120} className="scale-x-[-1] -rotate-45" />
        </div>
        <div className="absolute bottom-16 left-4 md:left-24 opacity-30 select-none pointer-events-none hidden sm:block">
           <Image src="/assets/secondary_arrow_sm_01.svg" alt="Arrow" width={80} height={80} className="rotate-45" />
        </div>
        
        <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-10 z-10">
          <span className="text-primary inline-block mr-2 md:mr-4">Join</span>us
        </h2>
        <Link 
          href="/signup" 
          className="bg-primary hover:bg-[#4d00cc] text-white px-10 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20 z-10"
        >
          Start now - it's free
        </Link>
        <p className="mt-8 text-xs font-bold text-zinc-500 uppercase tracking-widest z-10">or continue with</p>
      </section>

      {/* Footer Branding */}
      <footer className="bg-dark-bg text-white pt-24 pb-8 md:pb-16 px-6 md:px-12 flex flex-col items-center relative overflow-hidden">
        <div className="mb-12 md:mb-16 z-10">
          <Image 
            src="/assets/white logo.png" 
            alt="GoGodam White Logo" 
            width={100} 
            height={100} 
            className="object-contain w-20 md:w-24 opacity-90"
          />
        </div>
        
        <p className="text-xs md:text-sm font-bold opacity-60 mb-6 z-10 tracking-widest uppercase">© 2026 - GoGodam</p>
        
        <div className="w-full text-center mt-auto select-none pointer-events-none opacity-[0.03] absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className="text-[15vw] xl:text-[200px] font-black tracking-[-0.04em] leading-[0.7] block font-sans">
            GoGodam
          </span>
        </div>
      </footer>
    </div>
  );
}

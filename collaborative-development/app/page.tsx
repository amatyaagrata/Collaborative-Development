import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full bg-white">
      {/* Navbar */}
      <nav className="flex flex-row items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto w-full gap-4">
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative w-12 h-12 transition-transform group-hover:scale-110 duration-300">
            <Image 
              src="/assets/logo.png" 
              alt="GoGodam Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl md:text-4xl font-black text-primary tracking-tighter">GoGodam</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-10 font-bold text-sm md:text-lg whitespace-nowrap">
          <Link href="/login" className="hover:text-primary transition-colors py-2 px-1">Login</Link>
          <Link href="/signup" className="hover:text-primary transition-colors py-2 px-1">Signup</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-12 md:pt-24 pb-20 md:pb-32 text-center px-6 relative w-full overflow-hidden">
        <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[100px] font-black leading-[0.95] md:leading-[0.9] tracking-tighter mb-8 md:mb-10 max-w-5xl break-words">
          <span className="text-primary block mb-1 md:mb-2 italic">Inventory</span>
          <span className="text-foreground">System&Logistics</span>
        </h1>
        <div className="relative z-10">
          <Link 
            href="/signup" 
            className="bg-primary hover:bg-[#4d00cc] text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-extrabold text-base md:text-xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 inline-block"
          >
            Start now - it's free
          </Link>
          
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 z-0 hidden md:block animate-bounce opacity-40">
            <Image 
              src="/assets/grey_arrow_md_04.svg" 
              alt="Arrow pointing down" 
              width={24} height={60} 
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
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[1.1] max-w-3xl mb-6 md:mb-10">
            <span className="text-primary italic">Seamless</span> Continuity
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
            <p className="font-serif italic font-extrabold text-2xl md:text-3xl text-foreground">Replenishment</p>
          </div>

          <div className="hidden lg:block w-24 relative z-0 flex-shrink-0 opacity-40">
             <Image src="/assets/arrow_dot_02.svg" alt="Path arrow" width={100} height={30} className="w-full h-auto" />
          </div>

          <div className="flex flex-col items-center space-y-6 md:w-1/3 z-10 group">
            <div className="h-32 md:h-40 flex items-center justify-center bg-white p-6 rounded-[32px] shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/assets/yellow_shield_2.svg" alt="Quality Control" width={110} height={110} className="w-auto h-24 md:h-28 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
            </div>
            <p className="font-serif italic font-extrabold text-2xl md:text-3xl text-foreground">Quality Control</p>
          </div>

          <div className="hidden lg:block w-24 relative z-0 flex-shrink-0 opacity-40">
             <Image src="/assets/arrow_dot_02.svg" alt="Path arrow" width={100} height={30} className="w-full h-auto" />
          </div>

          <div className="flex flex-col items-center space-y-6 md:w-1/3 z-10 group">
            <div className="h-32 md:h-40 flex items-center justify-center bg-white p-6 rounded-[32px] shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/assets/hand-truch.svg" alt="Storage" width={110} height={110} className="w-auto h-24 md:h-28 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
            </div>
            <p className="font-serif italic font-extrabold text-2xl md:text-3xl text-foreground">Storage</p>
          </div>
        </div>
      </section>

      {/* Optimize Section */}
      <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col items-center text-center overflow-hidden">
        <div className="space-y-6 md:space-y-12 mb-16 md:mb-24 relative z-10">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[1.05] max-w-4xl mx-auto">
            <span className="text-primary italic">Optimize</span> your warehouse
          </h2>
          <p className="text-base md:text-xl text-zinc-600 leading-relaxed font-medium max-w-3xl mx-auto px-2">
            Keep your shelves stocked and your production lines moving with GoGodam's intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds.
          </p>
        </div>

        <div className="relative w-full max-w-5xl px-0 sm:px-6">
          <div className="bg-[#f0f2f5] rounded-[48px] md:rounded-[64px] aspect-video flex items-center justify-center w-full relative group shadow-inner border border-zinc-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-3xl md:text-6xl italic font-serif opacity-30 group-hover:opacity-60 transition-all text-foreground group-hover:scale-110 duration-700">screen shot</span>
            
            <div className="absolute -bottom-8 md:-bottom-12 -right-4 md:-right-8 w-28 md:w-44 h-28 md:h-44 z-20">
              <Image src="/assets/yellow_unbox.svg" alt="Unboxing Icon" fill className="object-contain drop-shadow-2xl group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-700 delay-100" />
            </div>
            
            <div className="absolute top-10 right-10 opacity-10 group-hover:scale-150 transition-transform duration-1000">
               <Image src="/assets/grey_arrow_loop_01.svg" alt="Loop" width={100} height={100} />
            </div>
          </div>
        </div>
      </section>

      {/* One Need Section */}
      <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tighter mb-20 md:mb-32 leading-tight">
          <span className="text-primary italic">One</span> need, one site.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24 md:gap-16 lg:gap-24">
            <div className="flex flex-col items-center group">
                <div className="h-32 md:h-48 flex items-center justify-center mb-6">
                  <Image src="/assets/Gemini_Generated_Image_3he0nh3he0nh3he0-Photoroom.png" alt="Sales" width={180} height={180} className="object-contain drop-shadow-lg w-auto h-32 md:h-44 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500" />
                </div>
                <p className="font-serif italic font-extrabold text-2xl md:text-4xl text-foreground">Sales</p>
                <div className="h-1 w-12 bg-primary rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col items-center group">
                <div className="h-32 md:h-48 flex items-center justify-center mb-6">
                  <Image src="/assets/Gemini_Generated_Image_g19kejg19kejg19k-Photoroom.png" alt="Tracking" width={180} height={180} className="object-contain drop-shadow-lg w-auto h-32 md:h-44 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500" />
                </div>
                <p className="font-serif italic font-extrabold text-2xl md:text-4xl text-foreground">Tracking</p>
                <div className="h-1 w-12 bg-primary rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col items-center group">
                <div className="h-32 md:h-48 flex items-center justify-center mb-6">
                  <Image src="/assets/Gemini_Generated_Image_soedpzsoedpzsoed-Photoroom.png" alt="Inventory" width={180} height={180} className="object-contain drop-shadow-lg w-auto h-32 md:h-44 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500" />
                </div>
                <p className="font-serif italic font-extrabold text-2xl md:text-4xl text-foreground">Inventory</p>
                <div className="h-1 w-12 bg-primary rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="pt-20 pb-32 md:py-40 flex flex-col items-center justify-center text-center px-6 relative max-w-4xl mx-auto w-full">
        <div className="absolute -top-10 right-4 md:right-0 opacity-20 select-none pointer-events-none hidden sm:block">
           <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={140} height={140} className="scale-x-[-1] -rotate-45" />
        </div>
        <div className="absolute -bottom-10 left-4 md:left-0 opacity-20 select-none pointer-events-none hidden sm:block">
           <Image src="/assets/secondary_arrow_sm_01.svg" alt="Arrow" width={100} height={100} className="rotate-45" />
        </div>
        
        <h2 className="text-6xl sm:text-8xl md:text-[110px] font-black tracking-tighter mb-14 md:mb-16 z-10 leading-none">
          <span className="text-primary italic inline-block mr-4 md:mr-6">Join</span>us
        </h2>
        <div className="flex flex-col items-center gap-6 z-10">
          <Link 
            href="/signup" 
            className="bg-primary hover:bg-[#4d00cc] text-white px-10 md:px-16 py-5 md:py-7 rounded-full font-black text-lg md:text-2xl shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95"
          >
            Start now - it's free
          </Link>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">or continue with</p>
            <div className="flex gap-4">
               {/* Placeholders for social logins */}
               <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center hover:bg-zinc-50 transition-colors cursor-pointer">G</div>
               <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center hover:bg-zinc-50 transition-colors cursor-pointer">F</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="bg-dark-bg text-white pt-32 pb-12 md:pb-24 px-6 md:px-12 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        
        <div className="mb-16 md:mb-24 z-10 relative group">
          <div className="absolute -inset-8 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-700"></div>
          <Image 
            src="/assets/white logo.png" 
            alt="GoGodam White Logo" 
            width={120} 
            height={120} 
            className="object-contain w-24 md:w-32 opacity-90 relative z-10"
          />
        </div>
        
        <div className="flex flex-col items-center gap-4 z-10">
          <p className="text-[10px] md:text-xs font-black opacity-40 tracking-[0.4em] uppercase">© 2026 - GoGodam Logistics Systems</p>
          <div className="flex gap-6 opacity-40 text-[10px] uppercase font-bold tracking-widest">
            <Link href="#" className="hover:opacity-100 transition-opacity">Privacy</Link>
            <Link href="#" className="hover:opacity-100 transition-opacity">Terms</Link>
            <Link href="#" className="hover:opacity-100 transition-opacity">Contact</Link>
          </div>
        </div>
        
        <div className="w-full text-center mt-auto select-none pointer-events-none opacity-[0.04] absolute bottom-[-5%] left-1/2 -translate-x-1/2 overflow-hidden whitespace-nowrap">
          <span className="text-[22vw] md:text-[20vw] lg:text-[18vw] font-black tracking-[-0.05em] leading-[0.5] block font-sans italic">
            GoGodam
          </span>
        </div>
      </footer>
    </div>
  );
}

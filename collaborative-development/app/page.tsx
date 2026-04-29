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
            Start now - it&apos;s free
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
            Keep your shelves stocked and your production lines moving with GoGodam&apos;s intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds, Make-to-Order (MTO) workflows, or a Master Production Schedule to eliminate stockouts entirely.
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
        <div className="flex-1 space-y-6 md:space-y-10 text-center lg:text-left relative z-10 lg:pr-10">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tighter leading-[1.1] max-w-xl mx-auto lg:mx-0">
            <span className="text-primary block mb-2">Optimize your</span>
            <span className="text-[#1e004b] block">warehouse</span>
          </h2>
          <p className="text-base md:text-xl text-[#1e004b] leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
            Keep your shelves stocked and your production lines moving with GoGodam&apos;s intelligent replenishment engine. Utilize advanced strategies such as minimum-maximum thresholds, Make-to-Order (MTO) workflows, or a Master Production Schedule to eliminate stockouts entirely.
          </p>
          <div className="absolute -top-4 right-0 lg:-right-4 opacity-30 hidden lg:block select-none pointer-events-none transform -scale-x-100 rotate-[-10deg]">
            <Image src="/assets/grey_arrow_loop_01.svg" alt="Arrow" width={100} height={100} />
          </div>
        </div>

        <div className="flex-1 relative w-full px-0 sm:px-6 group lg:mt-0 xl:pl-4">
          <div className="bg-[#f0f2f5] rounded-2xl md:rounded-[32px] aspect-video flex-grow flex items-center justify-center w-full relative shadow-inner border border-zinc-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-3xl md:text-5xl italic font-serif opacity-30 group-hover:opacity-60 transition-all text-foreground group-hover:scale-110 duration-700">screen shot</span>
          </div>

          <div className="absolute -bottom-8 right-2 md:-bottom-12 md:right-0 w-24 h-24 md:w-32 md:h-32 z-20">
            <Image src="/assets/yellow_unbox.svg" alt="Unboxing Icon" fill className="object-contain drop-shadow-2xl group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-700 delay-100" />
          </div>
        </div>
      </section>

      {/* One Need Section */}
      <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tighter mb-16 md:mb-24 leading-tight">
          <span className="text-primary">One</span> <span className="text-[#1e004b]">need, one site.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
          <div className="flex flex-col items-center space-y-10 group">
            <div className="flex items-center justify-center">
              <Image
                src="/assets/Gemini_Generated_Image_3he0nh3he0nh3he0-Photoroom.png"
                alt="Sales"
                width={280}
                height={280}
                className="icon-force-size drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 220px, 280px"
              />
            </div>
            <p className="font-caveat font-bold text-3xl md:text-4xl text-[#1e004b]">Sales</p>
          </div>
          <div className="flex flex-col items-center space-y-10 group">
            <div className="flex items-center justify-center">
              <Image
                src="/assets/Gemini_Generated_Image_g19kejg19kejg19k-Photoroom.png"
                alt="Tracking"
                width={280}
                height={280}
                className="icon-force-size drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 220px, 280px"
              />
            </div>
            <p className="font-caveat font-bold text-3xl md:text-4xl text-[#1e004b]">Tracking</p>
          </div>
          <div className="flex flex-col items-center space-y-10 group">
            <div className="flex items-center justify-center">
              <Image
                src="/assets/Gemini_Generated_Image_soedpzsoedpzsoed-Photoroom.png"
                alt="Inventory"
                width={280}
                height={280}
                className="icon-force-size drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 220px, 280px"
              />
            </div>
            <p className="font-caveat font-bold text-3xl md:text-4xl text-[#1e004b]">Inventory</p>
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
            Start now - It&apos;s free
          </Link>
          <p className="text-sm md:text-base font-medium text-zinc-500">or continue with</p>
        </div>
      </section>

      {/* Footer Branding & Links */}
      <footer className="bg-[#1e004b] text-white pt-20 px-6 md:px-12 flex flex-col items-center relative overflow-hidden w-full">

        {/* Top Section: Newsletter & Logo */}
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center lg:items-end justify-between gap-12 mb-16 z-10">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 w-full lg:w-1/2">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Get Exclusive Offers and GoGodam News</h3>
            <div className="flex w-full max-w-md bg-white rounded-full p-1 shadow-md">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-transparent px-4 py-2 text-zinc-900 outline-none w-full text-base"
              />
              <Link href="/signup" className="bg-primary hover:bg-[#4d00cc] text-white px-6 py-2 rounded-full font-bold transition-colors text-sm md:text-base whitespace-nowrap flex items-center justify-center">
                Sign Up
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 mb-4 lg:mb-0">
            <Image
              src="/assets/white logo.png"
              alt="GoGodam White Logo"
              width={100}
              height={100}
              className="object-contain w-20 md:w-24 opacity-90"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-7xl h-px bg-white/10 mb-16 z-10"></div>

        {/* Middle Section: Links Grid */}
        <div className="w-full max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-12 mb-20 z-10 text-sm md:text-base">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold mb-2">Information</h4>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Help</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Track My Order</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Returns</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Shipping</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold mb-2">Products</h4>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Inventory Management</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Order Tracking</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Custom Workflows</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Analytics</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold mb-2">Programs</h4>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">For Business</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Partner Program</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Affiliates</Link>
            <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">Discounts</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold mb-2">Locations</h4>
            <span className="opacity-70">United States</span>
            <span className="opacity-70">Canada</span>
            <span className="opacity-70">United Kingdom</span>
            <span className="opacity-70">Australia</span>
          </div>
        </div>

        {/* Bottom Section: Copyright & Massive Logo */}
        <div className="flex flex-col items-center gap-2 z-10 w-full pb-8">
          <div className="flex gap-4 text-xs font-medium opacity-60 mb-2">
            <Link href="#" className="hover:opacity-100 transition">Terms of Service</Link>
            <Link href="#" className="hover:opacity-100 transition">Privacy</Link>
          </div>
          <p className="text-xs md:text-sm font-medium opacity-60">© 2026 - GoGodam</p>
        </div>

        {/* Massive Text at the very bottom edge */}
        <div className="w-full text-center select-none pointer-events-none mt-4 -mb-4 z-0">
          <h1 className="text-[18vw] font-bold tracking-tighter leading-none">
            GoGodam
          </h1>
        </div>
      </footer>
    </div>
  );
}

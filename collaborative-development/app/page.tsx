import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    title: "Inventory control",
    description:
      "Track stock in real time, set reorder points, and prevent stockouts with simple, reliable workflows.",
    iconSrc: "/assets/yellow_unbox.svg",
  },
  {
    title: "Supplier & purchasing",
    description:
      "Manage suppliers, create purchase flows, and keep lead times visible so teams can plan with confidence.",
    iconSrc: "/assets/blue_truck.svg",
  },
  {
    title: "Delivery & tracking",
    description:
      "Coordinate deliveries and status updates so operations, suppliers, and drivers stay aligned end-to-end.",
    iconSrc: "/assets/Gemini_Generated_Image_g19kejg19kejg19k-Photoroom.png",
  },
] as const;

const STEPS = [
  {
    title: "Create an organization",
    description: "Set up your team and roles in minutes.",
  },
  {
    title: "Add products & categories",
    description: "Define items, units, and minimum stock levels.",
  },
  {
    title: "Start ordering",
    description: "Place orders, update status, and track delivery progress.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full bg-white text-foreground">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-zinc-100">
        <nav className="h-[72px] md:h-20 flex flex-row items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full gap-4">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative w-11 h-11 md:w-12 md:h-12 transition-transform group-hover:scale-105 duration-300">
              <Image
                src="/assets/logo.png"
                alt="GoGodam Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl md:text-2xl font-bold text-primary tracking-tighter leading-none">
              GoGodam
            </span>
          </Link>
          <div className="flex items-center gap-1.5 md:gap-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
            <Link
              href="/login"
              className="hover:text-primary transition-colors py-2.5 px-3.5 rounded-full"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-[#4d00cc] text-white py-3 px-5 md:px-6 rounded-full transition-colors shadow-sm shadow-primary/20 leading-none"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-56 right-0 w-[600px] h-[600px] bg-[#1e004b]/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 pt-10 md:pt-16 pb-12 md:pb-18">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start lg:items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-3 py-1 text-xs md:text-sm font-semibold text-zinc-700">
                  <span className="text-primary">New</span>
                  <span className="opacity-80">
                    Role-based dashboards + real-time updates
                  </span>
                </div>

                <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.02]">
                  Inventory, suppliers, and deliveries—
                  <span className="text-primary"> in one flow</span>.
                </h1>
                <p className="mt-5 text-base md:text-xl text-zinc-600 leading-relaxed max-w-2xl">
                  GoGodam helps teams keep stock accurate, purchasing predictable,
                  and deliveries visible. Built for admins, suppliers,
                  transporters, and inventory managers.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link
                    href="/signup"
                    className="bg-primary hover:bg-[#4d00cc] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.99] text-center"
                  >
                    Create your account
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg border border-zinc-200 hover:border-primary/50 hover:text-primary transition-colors text-center bg-white/70"
                  >
                    Sign in
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl border border-zinc-100 bg-white/60 px-4 py-3">
                    <p className="font-semibold">Fast setup</p>
                    <p className="text-zinc-600 mt-0.5">Start in minutes</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-white/60 px-4 py-3">
                    <p className="font-semibold">Secure by role</p>
                    <p className="text-zinc-600 mt-0.5">RLS policies</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-white/60 px-4 py-3">
                    <p className="font-semibold">Real-time</p>
                    <p className="text-zinc-600 mt-0.5">Live status updates</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-[32px] border border-zinc-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-500">Live overview</p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-zinc-100 bg-[#f8f9fb] p-4">
                        <p className="text-xs font-semibold text-zinc-500">Stock alerts</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight">12</p>
                        <p className="mt-1 text-xs text-zinc-600">Items below minimum</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-100 bg-[#f8f9fb] p-4">
                        <p className="text-xs font-semibold text-zinc-500">Deliveries</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight">7</p>
                        <p className="mt-1 text-xs text-zinc-600">In transit today</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-zinc-100 overflow-hidden">
                      <div className="px-4 py-3 bg-white flex items-center justify-between">
                        <p className="text-sm font-bold">Recent activity</p>
                        <span className="text-xs font-semibold text-primary">Real-time</span>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                            <Image src="/assets/yellow_unbox.svg" alt="" width={22} height={22} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Purchase order approved</p>
                            <p className="text-xs text-zinc-600">Warehouse • 2m ago</p>
                          </div>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                            <Image src="/assets/blue_truck.svg" alt="" width={22} height={22} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Driver assigned</p>
                            <p className="text-xs text-zinc-600">Transport • 6m ago</p>
                          </div>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                            <Image src="/assets/logo.png" alt="" width={22} height={22} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">New supplier invited</p>
                            <p className="text-xs text-zinc-600">Admin • 14m ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-500 text-center lg:text-left">
                  Preview UI for illustration (data shown is sample).
                </p>
              </div>
            </div>

            <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center flex-shrink-0">
                      <Image
                        src={feature.iconSrc}
                        alt=""
                        width={40}
                        height={40}
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
                  A workflow your whole operation can follow.
                </h2>
                <p className="mt-4 text-zinc-600 text-base md:text-lg leading-relaxed">
                  From supplier to warehouse to delivery, each role sees exactly
                  what they need—nothing more.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-zinc-500">Built with</p>
                  <p className="font-bold tracking-tight">Next.js + Supabase</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-zinc-500">Security</p>
                  <p className="font-bold tracking-tight">RLS by default</p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-zinc-100 bg-white p-6 md:p-7 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-lg md:text-xl">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-zinc-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-[#f8f9fb] border-y border-zinc-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
                  Built for every role.
                </h2>
                <p className="mt-4 text-zinc-600 text-base md:text-lg leading-relaxed">
                  Admins manage users and data. Suppliers confirm orders.
                  Transporters update delivery status. Inventory managers keep
                  stock accurate.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="bg-[#1e004b] hover:bg-[#150035] text-white px-6 py-3 rounded-full font-bold transition-colors text-center"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 rounded-full font-bold border border-zinc-200 hover:border-[#1e004b]/30 transition-colors text-center bg-white"
                  >
                    I already have an account
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-zinc-100 shadow-sm p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-100 p-5">
                    <p className="font-bold">Admin</p>
                    <p className="text-sm text-zinc-600 mt-1">
                      Users, stats, oversight
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 p-5">
                    <p className="font-bold">Supplier</p>
                    <p className="text-sm text-zinc-600 mt-1">
                      Orders, confirmations
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 p-5">
                    <p className="font-bold">Transporter</p>
                    <p className="text-sm text-zinc-600 mt-1">
                      Pickups, delivery status
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 p-5">
                    <p className="font-bold">Inventory</p>
                    <p className="text-sm text-zinc-600 mt-1">
                      Stock, products, flow
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-5">
                  <p className="font-bold">Tip</p>
                  <p className="text-sm text-zinc-700 mt-1">
                    Use the test users script to explore every dashboard quickly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="rounded-[40px] md:rounded-[56px] border border-zinc-100 bg-[#1e004b] text-white p-8 md:p-12 overflow-hidden relative">
              <div className="absolute -top-24 -right-24 w-[360px] h-[360px] bg-primary/30 blur-[90px] rounded-full" />
              <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] bg-white/10 blur-[100px] rounded-full" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="max-w-2xl">
                  <h2 className="text-white text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
                    Ready to organize your operations?
                  </h2>
                  <p className="mt-4 text-white/80 text-base md:text-lg leading-relaxed">
                    Create an account, invite your team, and start managing
                    stock and orders with role-based access.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="bg-white text-[#1e004b] hover:bg-white/90 px-7 py-3 rounded-full font-bold transition-colors text-center"
                  >
                    Start free
                  </Link>
                  <Link
                    href="/login"
                    className="border border-white/25 hover:border-white/40 px-7 py-3 rounded-full font-bold transition-colors text-center"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/assets/logo.png"
                  alt="GoGodam Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="font-bold tracking-tight">GoGodam</p>
                <p className="text-sm text-zinc-600">
                  Inventory & logistics platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link
                href="/login"
                className="text-zinc-700 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-zinc-700 hover:text-primary transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-zinc-500">
            <p>© 2026 GoGodam. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <Link href="#" className="hover:text-zinc-700 transition-colors">
                Terms
              </Link>
              <span className="opacity-40">•</span>
              <Link href="#" className="hover:text-zinc-700 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

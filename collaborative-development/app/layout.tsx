import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Caveat } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-outfit' 
});

const caveat = Caveat({ 
  subsets: ['latin'], 
  variable: '--font-caveat' 
});

export const metadata: Metadata = {
  title: "GoGodam | Inventory System & Logistics",
  description: "Streamline your warehouse and logistics with our modern inventory management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased text-foreground bg-white overflow-x-hidden">
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGodam | Inventory System & Logistics",
  description: "Streamline your warehouse and logistics with our modern inventory management system.",
  icons: {
    icon: "/favicon.ico",
  },
};

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <meta name="theme-color" content="#7c3aed" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans antialiased">
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          toastOptions={{
            style: {
              background: 'var(--toast-bg, #ffffff)',
              color: 'var(--toast-text, #1a1a2e)',
              border: '1px solid var(--toast-border, #e2e8f0)',
            },
            duration: 4000,
          }}
        />
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans antialiased text-foreground bg-white overflow-x-hidden">
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}

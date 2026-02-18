import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ServiceProvider } from "@/context/ServiceContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yamaha MT-15 Service Tracker",
  description: "Track your bike maintenance records",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ServiceProvider>
          <Navbar />
          <main className="pt-24 min-h-screen bg-[#0a0a0a] text-white selection:bg-cyan-500/30">
            {children}
          </main>
        </ServiceProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AddRecordModal from "@/components/AddRecordModal";
import CockpitLoader from "@/components/CockpitLoader";
import SecurityGuardian from "@/components/SecurityGuardian";
import { ServiceProvider } from "@/context/ServiceContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "Yamaha MT-15 // Cockpit Telemetry",
  description: "The Dark Side of Japan - Digital Maintenance & Service Cockpit for Yamaha MT-15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className={`${inter.className} min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200 antialiased`}>
        {/* Ambient Cockpit Lights */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full" />
          <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-rose-500/8 blur-[140px] rounded-full" />
          <div className="absolute bottom-10 left-[-100px] w-[500px] h-[350px] bg-cyan-600/8 blur-[150px] rounded-full" />
        </div>

        <ServiceProvider>
          <SecurityGuardian />
          <CockpitLoader />
          <Navbar />
          <AddRecordModal />
          <main className="pt-24 pb-12 min-h-screen">
            {children}
          </main>
        </ServiceProvider>
      </body>
    </html>
  );
}

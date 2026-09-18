import LogoViewer from "@/components/LogoViewer";
import DashboardStats from "@/components/DashboardStats";
import RecentActivity from "@/components/RecentActivity";
import { Terminal, Radio } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
      {/* Cockpit Status Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
              COCKPIT // DIAGNOSTICS & TELEMETRY
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white flex items-center gap-3">
            MISSION <span className="text-cyan-400">CONTROL</span>
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-0.5">
            Yamaha MT-15 Real-time Service & Maintenance Console
          </p>
        </div>

        {/* Real-time Telemetry Pills */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/25 text-cyan-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>LINK: ATLAS MONGODB</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-gray-300 whitespace-nowrap">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>DIAGNOSTICS: NOMINAL</span>
          </div>
        </div>
      </header>

      {/* Row 1: Full-Width Telemetry Stat Gauges */}
      <section className="w-full">
        <DashboardStats />
      </section>

      {/* Row 2: 3D Stage & Recent Telemetry Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: 3D Emblem Visualizer (7 Cols) */}
        <section className="lg:col-span-7 h-[460px] w-full">
          <LogoViewer />
        </section>

        {/* Right Column: Recent Telemetry Logs (5 Cols) */}
        <section className="lg:col-span-5 h-[460px] w-full">
          <RecentActivity />
        </section>
      </div>
    </div>
  );
}

import LogoViewer from "@/components/LogoViewer";
import DashboardStats from "@/components/DashboardStats";
import RecentActivity from "@/components/RecentActivity";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 h-[calc(100vh-6rem)] flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
          Dashboard
        </h1>
        <p className="text-gray-400 text-sm">Welcome back, Rider.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column - 3D Viewer (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col min-h-[400px]">
          <LogoViewer />
        </section>

        {/* Right Column - Stats & Activity (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <DashboardStats />
          <div className="flex-1 min-h-[300px]">
            <RecentActivity />
          </div>
        </section>
      </div>
    </div>
  );
}

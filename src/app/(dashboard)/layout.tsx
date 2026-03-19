import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen p-4 pt-16 md:ml-64 md:p-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}

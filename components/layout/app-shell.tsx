import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar email={email} />
        <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { CategoryOption } from "@/types/app";

export function AppShell({
  email,
  categories,
  children
}: {
  email: string;
  categories: CategoryOption[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar email={email} categories={categories} />
        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
          {children}
        </main>
        <MobileBottomNav categories={categories} />
      </div>
    </div>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/services/category-service";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const categories = await getCategories();
  return (
    <AppShell username={user.username} categories={categories}>
      {children}
    </AppShell>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

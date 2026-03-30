export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold italic text-primary-foreground">
        B
      </div>
      {!compact ? <span className="text-[15px] font-semibold tracking-[-0.01em]">Budgetly</span> : null}
    </div>
  );
}

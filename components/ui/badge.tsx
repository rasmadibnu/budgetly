import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
        danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

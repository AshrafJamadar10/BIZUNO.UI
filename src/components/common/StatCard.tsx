import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/format";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  hint,
  icon: Icon,
  loading,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="surface-panel p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-7 w-32" />
        <Skeleton className="mt-3 h-3 w-20" />
      </div>
    );
  }

  const positive = (change ?? 0) >= 0;

  return (
    <div className={cn("surface-panel p-5 transition-shadow hover:shadow-pop", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="numeric mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {change !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {formatPercent(change)}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

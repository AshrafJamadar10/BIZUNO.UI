import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

const MAP: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  partial: { label: "Partially Paid", tone: "info" },
  pending: { label: "Pending", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "info" },
  processing: { label: "Processing", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  in_stock: { label: "In Stock", tone: "success" },
  low_stock: { label: "Low Stock", tone: "warning" },
  out_of_stock: { label: "Out of Stock", tone: "danger" },
  failed: { label: "Failed", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = MAP[status] ?? { label: status, tone: "neutral" as Tone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[entry.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {entry.label}
    </span>
  );
}

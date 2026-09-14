import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZES = [5, 10, 20, 50];

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          className="h-8 rounded-md border bg-background px-2 text-foreground"
          value={pageSize >= total && total > 0 ? "all" : String(pageSize)}
          onChange={(event) => {
            onPageSizeChange(event.target.value === "all" ? Math.max(total, 1) : Number(event.target.value));
            onPageChange(1);
          }}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          <option value="all">All</option>
        </select>
        <span>{firstRecord}-{lastRecord} of {total}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Page {page} of {totalPages}</span>
        <Button variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

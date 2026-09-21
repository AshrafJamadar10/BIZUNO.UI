import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePurchaseOrders } from "@/hooks/queries/suppliers";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/purchases/")({ component: PurchasesPage });

function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data } = usePurchaseOrders({ search, page, pageSize });

  return <AppShell>
    <PageHeader title="Purchases" description="Track purchase orders, expected deliveries and supplier spending." crumbs={[{ label: "Home", to: "/" }, { label: "Purchases" }]} />
    <Card className="p-0">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search purchase order, supplier or status" />
        <span className="ml-auto text-xs text-muted-foreground">{data?.total ?? 0} purchase orders</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Purchase order</TableHead><TableHead>Supplier</TableHead><TableHead>Issued</TableHead><TableHead>Expected</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{data?.rows.map((order) => <TableRow key={order.id}><TableCell className="font-medium">{order.number}</TableCell><TableCell>{order.supplierName}</TableCell><TableCell>{formatDate(order.issuedAt)}</TableCell><TableCell>{formatDate(order.expectedAt)}</TableCell><TableCell className="numeric text-right">{formatCurrency(order.total)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
      {!data?.rows.length && <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground"><ShoppingCart className="size-8" /><p>No purchase orders found.</p></div>}
      <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </Card>
  </AppShell>;
}

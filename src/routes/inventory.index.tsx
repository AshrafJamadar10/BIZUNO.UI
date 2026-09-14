import { createFileRoute } from "@tanstack/react-router";
import { Boxes, PackageX, Warehouse, ArrowRightLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory, useInventorySummary } from "@/hooks/queries/inventory";
import { stockStatusOf } from "@/services/inventory";
import { formatCurrency, formatNumber } from "@/utils/format";
import { useState } from "react";
import { Pagination } from "@/components/common/Pagination";

export const Route = createFileRoute("/inventory/")({ component: InventoryPage });

function InventoryPage() {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const { data: summary } = useInventorySummary();
  const { data } = useInventory({ search, page, pageSize });
  return <AppShell><PageHeader title="Inventory" description="Monitor stock levels, warehouse locations and inventory value." crumbs={[{ label: "Home", to: "/" }, { label: "Inventory" }]} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Products" value={formatNumber(summary?.totalProducts ?? 0)} icon={Boxes} /><StatCard label="Units on hand" value={formatNumber(summary?.totalUnits ?? 0)} icon={Warehouse} /><StatCard label="Low stock" value={formatNumber(summary?.lowStock ?? 0)} icon={ArrowRightLeft} /><StatCard label="Stock value" value={formatCurrency(summary?.stockValue ?? 0)} icon={PackageX} /></div>
    <Card className="p-0"><div className="border-b p-4"><SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search products or SKU" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Warehouse</TableHead><TableHead className="text-right">On hand</TableHead><TableHead className="text-right">Min. stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader><TableBody>{data?.rows.map((product) => <TableRow key={product.id}><TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku}</p></TableCell><TableCell>{product.warehouseId}</TableCell><TableCell className="numeric text-right">{formatNumber(product.stock)} {product.unit}</TableCell><TableCell className="numeric text-right">{formatNumber(product.minStock)}</TableCell><TableCell><StatusBadge status={stockStatusOf(product)} /></TableCell><TableCell className="numeric text-right">{formatCurrency(product.stock * product.purchasePrice)}</TableCell></TableRow>)}</TableBody></Table></div><Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card>
  </AppShell>;
}

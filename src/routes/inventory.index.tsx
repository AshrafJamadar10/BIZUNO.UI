import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, PackageX, Warehouse, ArrowRightLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory, useInventorySummary, useUpdateInventory, useWarehouses } from "@/hooks/queries/inventory";
import { stockStatusOf } from "@/services/inventory";
import { formatCurrency, formatNumber } from "@/utils/format";
import { useState } from "react";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/inventory/")({ component: InventoryPage });

function InventoryPage() {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<{ id: string; warehouseId: string; quantity: string } | null>(null);
  const { data: summary } = useInventorySummary();
  const { data: warehouses = [] } = useWarehouses();
  const { data } = useInventory({ search, page, pageSize, sortBy: "quantity", sortDir });
  const updateInventory = useUpdateInventory();
  return <AppShell><PageHeader title="Inventory" description="Monitor stock levels, warehouse locations and inventory value." crumbs={[{ label: "Home", to: "/" }, { label: "Inventory" }]} actions={<><Button asChild variant="outline"><Link to="/warehouses">Manage warehouses</Link></Button><Button asChild><Link to="/products">Add product</Link></Button></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Products" value={formatNumber(summary?.totalProducts ?? 0)} icon={Boxes} /><StatCard label="Units on hand" value={formatNumber(summary?.totalUnits ?? 0)} icon={Warehouse} /><StatCard label="Low stock" value={formatNumber(summary?.lowStock ?? 0)} icon={ArrowRightLeft} /><StatCard label="Stock value" value={formatCurrency(summary?.stockValue ?? 0)} icon={PackageX} /></div>
    <Card className="p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search products or SKU" /><label className="flex items-center gap-2 text-sm text-muted-foreground">Sort quantity <select className="h-9 rounded-md border bg-background px-3 text-sm text-foreground" value={sortDir} onChange={(event) => { setSortDir(event.target.value as "asc" | "desc"); setPage(1); }}><option value="asc">Low to high</option><option value="desc">High to low</option></select></label></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Warehouse</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Min. stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Value</TableHead><TableHead /></TableRow></TableHeader><TableBody>{data?.rows.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.productSku}</p></TableCell><TableCell>{item.warehouseName || warehouses.find((warehouse) => warehouse.id === item.warehouseId)?.name || item.warehouseId || "—"}</TableCell><TableCell className="numeric text-right">{formatNumber(item.quantity)}</TableCell><TableCell className="numeric text-right">{formatNumber(item.minStock)}</TableCell><TableCell><StatusBadge status={stockStatusOf(item)} /></TableCell><TableCell className="numeric text-right">{formatCurrency(item.quantity * item.purchasePrice)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Edit inventory for ${item.productName}`} onClick={() => setEditing({ id: item.id, warehouseId: item.warehouseId, quantity: String(item.quantity) })}><Pencil className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div><Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card>
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>Edit inventory</DialogTitle></DialogHeader>{editing ? <div className="space-y-3"><div><Label>Warehouse</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={editing.warehouseId} onChange={(event) => setEditing({ ...editing, warehouseId: event.target.value })}>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div><div><Label htmlFor="inventory-quantity">Quantity</Label><Input id="inventory-quantity" type="number" min="0" value={editing.quantity} onChange={(event) => setEditing({ ...editing, quantity: event.target.value })} className="mt-1.5" /></div></div> : null}<DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editing || Number(editing.quantity) < 0 || updateInventory.isPending} onClick={() => { if (!editing) return; updateInventory.mutate({ id: editing.id, input: { warehouseId: editing.warehouseId, quantity: Number(editing.quantity) } }, { onSuccess: () => { toast.success("Inventory updated"); setEditing(null); }, onError: (error: Error) => toast.error(error.message) }); }}>Save changes</Button></DialogFooter></DialogContent></Dialog>
  </AppShell>;
}

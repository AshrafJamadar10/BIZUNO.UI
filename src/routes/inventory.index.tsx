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
import { useInventory, useInventorySummary, useWarehouses } from "@/hooks/queries/inventory";
import { useUpdateProduct } from "@/hooks/queries/products";
import { stockStatusOf } from "@/services/inventory";
import { formatCurrency, formatNumber } from "@/utils/format";
import { useState } from "react";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MenuItem, TextField } from "@mui/material";

export const Route = createFileRoute("/inventory/")({ component: InventoryPage });

function InventoryPage() {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<{ id: string; warehouseId: string; stock: string } | null>(null);
  const { data: summary } = useInventorySummary();
  const { data: warehouses = [] } = useWarehouses();
  const { data } = useInventory({ search, page, pageSize });
  const updateProduct = useUpdateProduct();
  return <AppShell><PageHeader title="Inventory" description="Monitor stock levels, warehouse locations and inventory value." crumbs={[{ label: "Home", to: "/" }, { label: "Inventory" }]} actions={<><Button asChild variant="outline"><Link to="/warehouses">Manage warehouses</Link></Button><Button asChild><Link to="/products">Add product</Link></Button></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Products" value={formatNumber(summary?.totalProducts ?? 0)} icon={Boxes} /><StatCard label="Units on hand" value={formatNumber(summary?.totalUnits ?? 0)} icon={Warehouse} /><StatCard label="Low stock" value={formatNumber(summary?.lowStock ?? 0)} icon={ArrowRightLeft} /><StatCard label="Stock value" value={formatCurrency(summary?.stockValue ?? 0)} icon={PackageX} /></div>
    <Card className="p-0"><div className="border-b p-4"><SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search products or SKU" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Warehouse</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Min. stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Value</TableHead><TableHead /></TableRow></TableHeader><TableBody>{data?.rows.map((product) => <TableRow key={product.id}><TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku}</p></TableCell><TableCell>{warehouses.find((warehouse) => warehouse.id === product.warehouseId)?.name ?? product.warehouseId}</TableCell><TableCell className="numeric text-right">{formatNumber(product.stock)} {product.unit}</TableCell><TableCell className="numeric text-right">{formatNumber(product.minStock)}</TableCell><TableCell><StatusBadge status={stockStatusOf(product)} /></TableCell><TableCell className="numeric text-right">{formatCurrency(product.stock * product.purchasePrice)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Edit inventory for ${product.name}`} onClick={() => setEditing({ id: product.id, warehouseId: product.warehouseId, stock: String(product.stock) })}><Pencil className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div><Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card>
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>Edit inventory</DialogTitle></DialogHeader>{editing ? <div className="space-y-3 pt-2"><div><TextField fullWidth size="small" select label="Warehouse" value={editing.warehouseId} onChange={(event) => setEditing({ ...editing, warehouseId: event.target.value })}>{warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}</TextField></div><div><TextField fullWidth size="small" label="Quantity" id="inventory-quantity" type="number" value={editing.stock} onChange={(event) => setEditing({ ...editing, stock: event.target.value })} /></div></div> : null}<DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editing || Number(editing.stock) < 0 || updateProduct.isPending} onClick={() => { if (!editing) return; updateProduct.mutate({ id: editing.id, input: { warehouseId: editing.warehouseId, stock: Number(editing.stock) } }, { onSuccess: () => { toast.success("Inventory updated"); setEditing(null); }, onError: (error: Error) => toast.error(error.message) }); }}>Save changes</Button></DialogFooter></DialogContent></Dialog>
  </AppShell>;
}

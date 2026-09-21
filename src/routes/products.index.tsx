import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "@/hooks/queries/products";
import { useWarehouses } from "@/hooks/queries/inventory";
import { formatCurrency, formatNumber } from "@/utils/format";
import { ExportActions } from "@/components/common/ExportActions";
import { Pagination } from "@/components/common/Pagination";

export const Route = createFileRoute("/products/")({ component: ProductsPage });

const EMPTY = { name: "", barcode: "", categoryId: "", unit: "", purchasePrice: "", sellingPrice: "", taxRate: "", minStock: "", warehouseId: "", status: "" as "active" | "inactive" | "discontinued" | "", description: "" };

function ProductsPage() {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { data } = useProducts({ search, page, pageSize });
  const { data: categories = [] } = useCategories();
  const { data: warehouses = [] } = useWarehouses();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const set = (key: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <AppShell>
    <PageHeader title="Products" description="Manage your catalogue, pricing and product availability." crumbs={[{ label: "Home", to: "/" }, { label: "Products" }]} actions={<><ExportActions filename="products" headers={["Name", "SKU", "Category", "Selling price", "Stock", "Status"]} rows={(data?.rows ?? []).map((product) => [product.name, product.sku, product.categoryName, product.sellingPrice, product.stock, product.status])} /><Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> New product</Button></DialogTrigger>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingId ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["name", "barcode", "unit", "purchasePrice", "sellingPrice", "taxRate", "minStock"] as const).map((key) =>
              <div key={key}><Label htmlFor={`product-${key}`}>{key.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase())}</Label><Input id={`product-${key}`} maxLength={key === "name" ? 100 : undefined} value={form[key]} onChange={(e) => set(key, e.target.value)} className="mt-1.5" type={["purchasePrice", "sellingPrice", "taxRate", "minStock"].includes(key) ? "number" : "text"} /></div>,
            )}
            <div><Label>Category</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
            <div><Label>Warehouse</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.warehouseId} onChange={(e) => set("warehouseId", e.target.value)}><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
            <div><Label>Status</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}><option value="">Select status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></div>
            <div className="sm:col-span-2"><Label htmlFor="product-description">Description</Label><Textarea id="product-description" maxLength={500} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}>Cancel</Button>          <Button disabled={!form.name || !form.status || create.isPending || update.isPending} onClick={() => { const input = { ...form, purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined, sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined, taxRate: form.taxRate ? Number(form.taxRate) : undefined, minStock: form.minStock ? Number(form.minStock) : undefined, status: form.status as "active" | "inactive" | "discontinued" }; const options = { onSuccess: () => { toast.success(editingId ? "Product updated" : "Product added"); setOpen(false); setEditingId(null); setForm(EMPTY); } }; if (editingId) update.mutate({ id: editingId, input }, options); else create.mutate(input, options); }}>{editingId ? "Save changes" : "Save product"}</Button></DialogFooter>
        </DialogContent>
      </Dialog></>} />
    <Card className="p-0"><div className="flex flex-wrap items-center gap-3 border-b p-4"><SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search products, SKU or barcode" /><span className="ml-auto text-xs text-muted-foreground">{data?.total ?? 0} products</span></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Stock</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{data?.rows.map((product) => <TableRow key={product.id}><TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.barcode}</p></TableCell><TableCell className="text-sm">{product.sku}</TableCell><TableCell className="text-sm">{product.categoryName}</TableCell><TableCell className="numeric text-right">{formatCurrency(product.sellingPrice)}</TableCell><TableCell className="numeric text-right">{formatNumber(product.stock)} {product.unit}</TableCell><TableCell><StatusBadge status={product.status} /></TableCell>      <TableCell className="text-right">      <Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`} onClick={() => { setEditingId(product.id); setForm({ name: product.name, barcode: product.barcode, categoryId: product.categoryId, unit: product.unit, purchasePrice: String(product.purchasePrice), sellingPrice: String(product.sellingPrice), taxRate: String(product.taxRate), minStock: String(product.minStock), warehouseId: product.warehouseId, status: product.status, description: product.description ?? "" }); setOpen(true); }}><Pencil className="size-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${product.name}`} onClick={() => remove.mutate(product.id, { onSuccess: () => toast.success("Product deleted") })}><Trash2 className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div>
      <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </Card>
  </AppShell>;
}

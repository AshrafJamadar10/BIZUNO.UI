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
import { MenuItem, TextField } from "@mui/material";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "@/hooks/queries/products";
import { formatCurrency, formatNumber } from "@/utils/format";
import { ExportActions } from "@/components/common/ExportActions";
import { Pagination } from "@/components/common/Pagination";

export const Route = createFileRoute("/products/")({ component: ProductsPage });

const EMPTY = { name: "", sku: "", barcode: "", categoryId: "cat-1", unit: "pcs", purchasePrice: "0", sellingPrice: "0", taxRate: "18", stock: "0", minStock: "0", warehouseId: "wh-1", status: "active" as "active" | "inactive", description: "" };

function ProductsPage() {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { data } = useProducts({ search, page, pageSize });
  const { data: categories = [] } = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const set = (key: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <AppShell>
    <PageHeader title="Products" description="Manage your catalogue, pricing and product availability." crumbs={[{ label: "Home", to: "/" }, { label: "Products" }]} actions={<><ExportActions filename="products" headers={["Name", "SKU", "Category", "Selling price", "Stock", "Status"]} rows={(data?.rows ?? []).map((product) => [product.name, product.sku, product.categoryName, product.sellingPrice, product.stock, product.status])} /><Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> New product</Button></DialogTrigger>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingId ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["name", "sku", "barcode", "unit", "purchasePrice", "sellingPrice", "taxRate", "stock", "minStock"] as const).map((key) =>
              <div key={key}><TextField fullWidth size="small" label={key.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase())} id={`product-${key}`} value={form[key]} onChange={(e) => set(key, e.target.value)} type={["purchasePrice", "sellingPrice", "taxRate", "stock", "minStock"].includes(key) ? "number" : "text"} /></div>,
            )}
            <div><TextField fullWidth size="small" select label="Category" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</TextField></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}>Cancel</Button><Button disabled={!form.name || !form.sku || create.isPending || update.isPending} onClick={() => { const input = { ...form, purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), taxRate: Number(form.taxRate), stock: Number(form.stock), minStock: Number(form.minStock) }; const options = { onSuccess: () => { toast.success(editingId ? "Product updated" : "Product added"); setOpen(false); setEditingId(null); setForm(EMPTY); } }; if (editingId) update.mutate({ id: editingId, input }, options); else create.mutate(input, options); }}>{editingId ? "Save changes" : "Save product"}</Button></DialogFooter>
        </DialogContent>
      </Dialog></>} />
    <Card className="p-0"><div className="flex flex-wrap items-center gap-3 border-b p-4"><SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search products, SKU or barcode" /><span className="ml-auto text-xs text-muted-foreground">{data?.total ?? 0} products</span></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Stock</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{data?.rows.map((product) => <TableRow key={product.id}><TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.barcode}</p></TableCell><TableCell className="text-sm">{product.sku}</TableCell><TableCell className="text-sm">{product.categoryName}</TableCell><TableCell className="numeric text-right">{formatCurrency(product.sellingPrice)}</TableCell><TableCell className="numeric text-right">{formatNumber(product.stock)} {product.unit}</TableCell><TableCell><StatusBadge status={product.status} /></TableCell>      <TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`} onClick={() => { setEditingId(product.id); setForm({ ...product, purchasePrice: String(product.purchasePrice), sellingPrice: String(product.sellingPrice), taxRate: String(product.taxRate), stock: String(product.stock), minStock: String(product.minStock), description: product.description ?? "" }); setOpen(true); }}><Pencil className="size-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${product.name}`} onClick={() => remove.mutate(product.id, { onSuccess: () => toast.success("Product deleted") })}><Trash2 className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div>
      <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </Card>
  </AppShell>;
}

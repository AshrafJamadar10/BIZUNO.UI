import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/queries/products";
import { Pagination } from "@/components/common/Pagination";

export const Route = createFileRoute("/categories/")({ component: CategoriesPage });

const EMPTY = { name: "", description: "" };

function CategoriesPage() {
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { data: categories = [] } = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const close = () => { setOpen(false); setEditingId(null); setForm(EMPTY); };
  const visibleCategories = categories.slice((page - 1) * pageSize, page * pageSize);

  return <AppShell>
    <PageHeader title="Product categories" description="Organise products into clear, reusable catalogue groups." crumbs={[{ label: "Home", to: "/" }, { label: "Product categories" }]} actions={<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> New category</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>{editingId ? "Edit category" : "Add category"}</DialogTitle></DialogHeader>
        <div className="space-y-3"><div><Label htmlFor="category-name">Name</Label><Input id="category-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
          <div><Label htmlFor="category-description">Description</Label><Input id="category-description" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!form.name.trim() || create.isPending || update.isPending} onClick={() => { const options = { onSuccess: () => { toast.success(editingId ? "Category updated" : "Category added"); close(); }, onError: (error: Error) => toast.error(error.message) }; if (editingId) update.mutate({ id: editingId, input: form }, options); else create.mutate(form, options); }}>{editingId ? "Save changes" : "Save category"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>} />
    <Card className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Products</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{visibleCategories.map((category) => <TableRow key={category.id}><TableCell className="font-medium">{category.name}</TableCell><TableCell>{category.description || "—"}</TableCell><TableCell>{category.productCount}</TableCell><TableCell><StatusBadge status={category.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Edit ${category.name}`} onClick={() => { setEditingId(category.id); setForm({ name: category.name, description: category.description ?? "" }); setOpen(true); }}><Pencil className="size-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${category.name}`} onClick={() => remove.mutate(category.id, { onSuccess: () => toast.success("Category deleted"), onError: (error: Error) => toast.error(error.message) })}><Trash2 className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div><Pagination page={page} pageSize={pageSize} total={categories.length} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card>
  </AppShell>;
}

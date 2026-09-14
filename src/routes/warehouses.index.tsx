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
import { useCreateWarehouse, useDeleteWarehouse, useUpdateWarehouse, useWarehouses } from "@/hooks/queries/inventory";
import { Pagination } from "@/components/common/Pagination";

export const Route = createFileRoute("/warehouses/")({ component: WarehousesPage });

const EMPTY = { name: "", location: "", manager: "", phone: "", status: "active" as "active" | "inactive" };

function WarehousesPage() {
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { data: warehouses = [] } = useWarehouses();
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  const remove = useDeleteWarehouse();
  const set = (key: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const close = () => { setOpen(false); setEditingId(null); setForm(EMPTY); };
  const visibleWarehouses = warehouses.slice((page - 1) * pageSize, page * pageSize);

  return <AppShell>
    <PageHeader title="Warehouses" description="Manage storage locations and the people responsible for them." crumbs={[{ label: "Home", to: "/" }, { label: "Warehouses" }]} actions={<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> New warehouse</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>{editingId ? "Edit warehouse" : "Add warehouse"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">{(["name", "location", "manager", "phone"] as const).map((key) => <div key={key}><Label htmlFor={`warehouse-${key}`}>{key[0].toUpperCase() + key.slice(1)}</Label><Input id={`warehouse-${key}`} value={form[key]} onChange={(e) => set(key, e.target.value)} className="mt-1.5" /></div>)}<div><Label>Status</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
        <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!form.name.trim() || !form.location.trim() || create.isPending || update.isPending} onClick={() => { const options = { onSuccess: () => { toast.success(editingId ? "Warehouse updated" : "Warehouse added"); close(); }, onError: (error: Error) => toast.error(error.message) }; if (editingId) update.mutate({ id: editingId, input: form }, options); else create.mutate(form, options); }}>{editingId ? "Save changes" : "Save warehouse"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>} />
    <Card className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Warehouse</TableHead><TableHead>Location</TableHead><TableHead>Manager</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>    <TableBody>{visibleWarehouses.map((warehouse) => <TableRow key={warehouse.id}><TableCell className="font-medium">{warehouse.name}</TableCell><TableCell>{warehouse.location}</TableCell><TableCell>{warehouse.manager}</TableCell><TableCell>{warehouse.phone}</TableCell><TableCell><StatusBadge status={warehouse.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Edit ${warehouse.name}`} onClick={() => { setEditingId(warehouse.id); setForm({ name: warehouse.name, location: warehouse.location, manager: warehouse.manager, phone: warehouse.phone, status: warehouse.status }); setOpen(true); }}><Pencil className="size-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${warehouse.name}`} onClick={() => remove.mutate(warehouse.id, { onSuccess: () => toast.success("Warehouse deleted"), onError: (error: Error) => toast.error(error.message) })}><Trash2 className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div><Pagination page={page} pageSize={pageSize} total={warehouses.length} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card>
  </AppShell>;
}

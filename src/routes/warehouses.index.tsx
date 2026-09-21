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

const EMPTY = { name: "", location: "", contactPerson: "", phone: "", status: "" as "active" | "inactive" | "" };

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
    <PageHeader title="Warehouses" description="Manage your storage locations and warehouse status." crumbs={[{ label: "Home", to: "/" }, { label: "Warehouses" }]} actions={<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> New warehouse</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>{editingId ? "Edit warehouse" : "Add warehouse"}</DialogTitle></DialogHeader>
        <div className="space-y-3"><div><Label htmlFor="warehouse-name">Warehouse</Label><Input id="warehouse-name" maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="warehouse-location">Location</Label><Input id="warehouse-location" maxLength={200} value={form.location} onChange={(e) => set("location", e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="warehouse-contact">Contact person</Label><Input id="warehouse-contact" maxLength={100} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="warehouse-phone">Phone</Label><Input id="warehouse-phone" maxLength={20} value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" /></div><div><Label>Status</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}><option value="">Select status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
        <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!form.name.trim() || (Boolean(editingId) && !form.status) || create.isPending || update.isPending} onClick={() => { const options = { onSuccess: () => { toast.success(editingId ? "Warehouse updated" : "Warehouse added"); close(); }, onError: (error: Error) => toast.error(error.message) }; if (editingId) update.mutate({ id: editingId, input: form as { name: string; location: string; status: "active" | "inactive" } }, options); else create.mutate(form as { name: string; location: string; status: "active" | "inactive" }, options); }}>{editingId ? "Save changes" : "Save warehouse"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>} />
    <Card className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Warehouse</TableHead>    <TableHead>Location</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>    <TableBody>{visibleWarehouses.map((warehouse) => <TableRow key={warehouse.id}><TableCell className="font-medium">{warehouse.name}</TableCell><TableCell>{warehouse.location}</TableCell><TableCell><StatusBadge status={warehouse.status} /></TableCell><TableCell className="text-right">    <Button variant="ghost" size="icon" aria-label={`Edit ${warehouse.name}`} onClick={() => { setEditingId(warehouse.id); setForm({ name: warehouse.name, location: warehouse.location, contactPerson: warehouse.contactPerson ?? "", phone: warehouse.phone ?? "", status: warehouse.status }); setOpen(true); }}><Pencil className="size-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${warehouse.name}`} onClick={() => remove.mutate(warehouse.id, { onSuccess: () => toast.success("Warehouse deleted"), onError: (error: Error) => toast.error(error.message) })}><Trash2 className="size-4 text-muted-foreground" /></Button></TableCell></TableRow>)}</TableBody></Table></div><Pagination page={page} pageSize={pageSize} total={warehouses.length} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card>
  </AppShell>;
}

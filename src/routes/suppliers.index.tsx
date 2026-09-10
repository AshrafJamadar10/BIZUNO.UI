import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateSupplier, usePurchaseOrders, useSuppliers } from "@/hooks/queries/suppliers";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/suppliers/")({ component: SuppliersPage });
const EMPTY = { name: "", contactPerson: "", phone: "", email: "", gstin: "", city: "", status: "active" as const };
function SuppliersPage() {
  const [search, setSearch] = useState(""); const [open, setOpen] = useState(false); const [form, setForm] = useState(EMPTY);
  const { data } = useSuppliers({ search, pageSize: 50 }); const { data: orders } = usePurchaseOrders({ pageSize: 50 }); const create = useCreateSupplier();
  const set = (key: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <AppShell><PageHeader title="Suppliers & Purchasing" description="Manage vendor relationships, purchase orders and incoming stock." crumbs={[{ label: "Home", to: "/" }, { label: "Suppliers & Purchasing" }]} actions={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> New supplier</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add supplier</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2">{(["name", "contactPerson", "phone", "email", "gstin", "city"] as const).map((key) => <div key={key}><Label>{key.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase())}</Label><Input className="mt-1.5" value={form[key]} onChange={(e) => set(key, e.target.value)} /></div>)}</div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!form.name || create.isPending} onClick={() => create.mutate(form, { onSuccess: () => { toast.success("Supplier added"); setOpen(false); setForm(EMPTY); } })}>Save supplier</Button></DialogFooter></DialogContent></Dialog>} /><Card className="p-0"><div className="border-b p-4"><SearchInput value={search} onChange={setSearch} placeholder="Search suppliers, city or contact" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead>Contact</TableHead><TableHead>City</TableHead><TableHead className="text-right">Outstanding</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data?.rows.map((supplier) => <TableRow key={supplier.id}><TableCell><p className="font-medium">{supplier.name}</p><p className="text-xs text-muted-foreground">{supplier.gstin ?? "GSTIN not added"}</p></TableCell><TableCell>{supplier.contactPerson}<p className="text-xs text-muted-foreground">{supplier.phone}</p></TableCell><TableCell>{supplier.city}</TableCell><TableCell className="numeric text-right">{formatCurrency(supplier.outstanding)}</TableCell><TableCell><StatusBadge status={supplier.status} /></TableCell></TableRow>)}</TableBody></Table></div></Card><Card className="p-0"><div className="border-b p-4"><h2 className="font-semibold">Purchase orders</h2></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Supplier</TableHead><TableHead>Issued</TableHead><TableHead>Expected</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{orders?.rows.map((order) => <TableRow key={order.id}><TableCell className="font-medium">{order.number}</TableCell><TableCell>{order.supplierName}</TableCell><TableCell>{formatDate(order.issuedAt)}</TableCell><TableCell>{formatDate(order.expectedAt)}</TableCell><TableCell className="numeric text-right">{formatCurrency(order.total)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}</TableBody></Table></div></Card><div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="size-4" /> Purchase receiving and stock reconciliation are ready to connect to the backend inventory ledger.</div></AppShell>;
}

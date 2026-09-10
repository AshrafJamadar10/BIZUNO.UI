import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateTenant, usePlatformTenants, useSubscriptionPackages } from "@/hooks/queries/platform";
import { formatDate, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/platform/tenants")({ beforeLoad: () => { if (window.localStorage.getItem("biznexus-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" }); }, component: TenantsPage });
function TenantsPage() {
  const { data: tenants = [] } = usePlatformTenants(); const { data: packages = [] } = useSubscriptionPackages(); const create = useCreateTenant(); const [open, setOpen] = useState(false); const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", plan: "Growth" });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <PlatformShell><PageHeader title="Tenants & businesses" description="Create and manage isolated business workspaces." actions={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> Create business</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create tenant workspace</DialogTitle></DialogHeader><div className="space-y-3">{(["businessName", "ownerName", "email"] as const).map((key) => <div key={key}><Label>{key.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase())}</Label><Input className="mt-1.5" value={form[key]} onChange={(e) => set(key, e.target.value)} /> </div>)}<div><Label>Subscription package</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.plan} onChange={(e) => set("plan", e.target.value)}>{packages.map((pkg) => <option key={pkg.id}>{pkg.name}</option>)}</select></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!form.businessName || !form.ownerName || create.isPending} onClick={() => create.mutate(form, { onSuccess: () => { toast.success("Tenant workspace created"); setOpen(false); setForm({ businessName: "", ownerName: "", email: "", plan: "Growth" }); } })}>Create tenant</Button></DialogFooter></DialogContent></Dialog>} /><Card className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Owner</TableHead><TableHead>Plan</TableHead><TableHead>Users</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{tenants.map((tenant) => <TableRow key={tenant.id}><TableCell><p className="font-medium">{tenant.businessName}</p><p className="text-xs text-muted-foreground">{tenant.email}</p></TableCell><TableCell>{tenant.ownerName}</TableCell><TableCell>{tenant.plan}</TableCell><TableCell>{formatNumber(tenant.users)}</TableCell><TableCell>{formatDate(tenant.createdAt)}</TableCell><TableCell><StatusBadge status={tenant.status} /></TableCell></TableRow>)}</TableBody></Table></div></Card></PlatformShell>;
}

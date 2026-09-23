import { FormProvider, useForm } from "react-hook-form";
import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TextInputField from "@/components/MUI/TextInputField";
import EmailField from "@/components/MUI/EmailField";
import DropdownField from "@/components/MUI/DropdownField";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateTenant, usePlatformTenants, useSubscriptionPackages, useUpdateTenant } from "@/hooks/queries/platform";
import { formatDate, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/platform/tenants")({ beforeLoad: () => { if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/login" }); }, component: TenantsPage });
function TenantsPage() {
  const { data: tenants = [] } = usePlatformTenants(); const { data: packages = [] } = useSubscriptionPackages(); const create = useCreateTenant(); const update = useUpdateTenant(); const [open, setOpen] = useState(false); const [editingId, setEditingId] = useState<string | null>(null);
  type TenantForm = { businessName: string; ownerName: string; email: string; plan: string };
  const methods = useForm<TenantForm>({ defaultValues: { businessName: "", ownerName: "", email: "", plan: "Growth" } });
  const resetForm = () => { methods.reset({ businessName: "", ownerName: "", email: "", plan: packages[0]?.name ?? "Growth" }); setEditingId(null); };
  const saveTenant = (form: TenantForm) => {
    const onSuccess = () => { toast.success(editingId ? "Tenant updated" : "Tenant workspace created"); setOpen(false); resetForm(); };
    if (editingId) update.mutate({ id: editingId, input: form }, { onSuccess }); else create.mutate(form, { onSuccess });
  };
  return <PlatformShell><PageHeader title="Businesses" description="Create and manage isolated business workspaces." actions={<Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}><DialogTrigger asChild><Button><Plus className="size-4" /> Create business</Button></DialogTrigger><DialogContent><FormProvider {...methods}><form onSubmit={methods.handleSubmit(saveTenant)}><DialogHeader><DialogTitle>{editingId ? "Edit business" : "Create business"}</DialogTitle></DialogHeader><div className="space-y-3 pt-2"><TextInputField name="businessName" label="Business name" inputType="alphabet" required /><TextInputField name="ownerName" label="Owner name" inputType="alphabet" required /><EmailField name="email" label="Email address" required /><DropdownField name="plan" label="Subscription package" required options={packages.map((pkg) => ({ label: pkg.name, value: pkg.name }))} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending || update.isPending}>{editingId ? "Save changes" : "Create business"}</Button></DialogFooter></form></FormProvider></DialogContent></Dialog>} /><Card className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Owner</TableHead><TableHead>Plan</TableHead><TableHead>Users</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{tenants.map((tenant) => <TableRow key={tenant.id}><TableCell><p className="font-medium">{tenant.businessName}</p><p className="text-xs text-muted-foreground">{tenant.email}</p></TableCell><TableCell>{tenant.ownerName}</TableCell><TableCell>{tenant.plan}</TableCell><TableCell>{formatNumber(tenant.users)}</TableCell><TableCell>{formatDate(tenant.createdAt)}</TableCell><TableCell><StatusBadge status={tenant.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Edit ${tenant.businessName}`} onClick={() => { setEditingId(tenant.id); methods.reset({ businessName: tenant.businessName, ownerName: tenant.ownerName, email: tenant.email, plan: tenant.plan }); setOpen(true); }}><Pencil className="size-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div></Card></PlatformShell>;
}

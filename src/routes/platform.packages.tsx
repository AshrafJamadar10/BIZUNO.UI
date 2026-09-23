import { createFileRoute, redirect } from "@tanstack/react-router";
import { FormProvider, useForm } from "react-hook-form";
import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TextInputField from "@/components/MUI/TextInputField";
import NumericField from "@/components/MUI/NumericField";
import { useCreatePackage, useSubscriptionPackages, useUpdatePackage } from "@/hooks/queries/platform";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/platform/packages")({ beforeLoad: () => { if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/login" }); }, component: PackagesPage });
function PackagesPage() {
  const { data: packages = [] } = useSubscriptionPackages(); const update = useUpdatePackage(); const create = useCreatePackage(); const [editing, setEditing] = useState<(typeof packages)[number] | null>(null); const [dialogOpen, setDialogOpen] = useState(false);
  type PackageForm = { name: string; monthlyPrice: string; annualPrice: string; userLimit: string };
  const methods = useForm<PackageForm>({ defaultValues: { name: "", monthlyPrice: "", annualPrice: "", userLimit: "" } });
  const openEdit = (pkg: (typeof packages)[number]) => { setEditing(pkg); methods.reset({ name: pkg.name, monthlyPrice: String(pkg.monthlyPrice), annualPrice: String(pkg.annualPrice), userLimit: String(pkg.userLimit) }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); methods.reset({ name: "", monthlyPrice: "", annualPrice: "", userLimit: "" }); setDialogOpen(true); };
  const savePackage = (form: PackageForm) => {
    const input = { name: form.name, monthlyPrice: Number(form.monthlyPrice), annualPrice: Number(form.annualPrice), userLimit: Number(form.userLimit) };
    const onSuccess = () => { toast.success(editing ? "Package updated" : "Package created"); setEditing(null); setDialogOpen(false); methods.reset(); };
    if (editing) update.mutate({ id: editing.id, input }, { onSuccess }); else create.mutate(input, { onSuccess });
  };
  return <PlatformShell><PageHeader title="Subscription packages" description="Configure plans, pricing, limits and feature access." actions={<Button onClick={openCreate}><Plus className="size-4" /> New package</Button>} /><div className="grid gap-4 lg:grid-cols-3">{packages.map((pkg) => <Card key={pkg.id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{pkg.name}</h2><p className="mt-1 text-sm text-muted-foreground">{pkg.activeTenants} active tenants</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-success/12 px-2 py-1 text-xs text-success">{pkg.status}</span><Button variant="ghost" size="icon" aria-label={`Edit ${pkg.name}`} onClick={() => openEdit(pkg)}><Pencil className="size-4" /></Button></div></div><p className="numeric mt-6 text-3xl font-semibold">{formatCurrency(pkg.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p><p className="mt-1 text-xs text-muted-foreground">{formatCurrency(pkg.annualPrice)} billed annually · up to {formatNumber(pkg.userLimit)} users</p><ul className="mt-6 space-y-3 border-t pt-5 text-sm">{pkg.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="size-4 text-success" />{feature}</li>)}</ul></Card>)}</div><Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); methods.reset(); } }}><DialogContent><FormProvider {...methods}><form onSubmit={methods.handleSubmit(savePackage)}><DialogHeader><DialogTitle>{editing ? "Edit package" : "Create package"}</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><TextInputField name="name" label="Package name" inputType="alphabet" required /><NumericField name="monthlyPrice" label="Monthly price" min={0} max={999999999} decimal required /><NumericField name="annualPrice" label="Annual price" min={0} max={999999999} decimal required /><NumericField name="userLimit" label="User limit" min={1} max={999999999} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={update.isPending || create.isPending}>Save changes</Button></DialogFooter></form></FormProvider></DialogContent></Dialog></PlatformShell>;
}

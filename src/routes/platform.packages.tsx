import { createFileRoute, redirect } from "@tanstack/react-router";
import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubscriptionPackages, useUpdatePackage } from "@/hooks/queries/platform";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/platform/packages")({ beforeLoad: () => { if (window.localStorage.getItem("biznexus-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" }); }, component: PackagesPage });
function PackagesPage() {
  const { data: packages = [] } = useSubscriptionPackages(); const update = useUpdatePackage(); const [editing, setEditing] = useState<(typeof packages)[number] | null>(null); const [form, setForm] = useState({ name: "", monthlyPrice: "", annualPrice: "", userLimit: "" });
  const openEdit = (pkg: (typeof packages)[number]) => { setEditing(pkg); setForm({ name: pkg.name, monthlyPrice: String(pkg.monthlyPrice), annualPrice: String(pkg.annualPrice), userLimit: String(pkg.userLimit) }); };
  return <PlatformShell><PageHeader title="Subscription packages" description="Configure plans, pricing, limits and feature access." actions={<Button onClick={() => packages[0] && openEdit(packages[0])}><Plus className="size-4" /> New package</Button>} /><div className="grid gap-4 lg:grid-cols-3">{packages.map((pkg) => <Card key={pkg.id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{pkg.name}</h2><p className="mt-1 text-sm text-muted-foreground">{pkg.activeTenants} active tenants</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-success/12 px-2 py-1 text-xs text-success">{pkg.status}</span><Button variant="ghost" size="icon" aria-label={`Edit ${pkg.name}`} onClick={() => openEdit(pkg)}><Pencil className="size-4" /></Button></div></div><p className="numeric mt-6 text-3xl font-semibold">{formatCurrency(pkg.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p><p className="mt-1 text-xs text-muted-foreground">{formatCurrency(pkg.annualPrice)} billed annually · up to {formatNumber(pkg.userLimit)} users</p><ul className="mt-6 space-y-3 border-t pt-5 text-sm">{pkg.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="size-4 text-success" />{feature}</li>)}</ul></Card>)}</div><Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit package</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2">{(["name", "monthlyPrice", "annualPrice", "userLimit"] as const).map((key) => <div key={key}><Label>{key.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase())}</Label><Input className="mt-1.5" type={key === "name" ? "text" : "number"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>)}</div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!form.name || update.isPending} onClick={() => editing && update.mutate({ id: editing.id, input: { name: form.name, monthlyPrice: Number(form.monthlyPrice), annualPrice: Number(form.annualPrice), userLimit: Number(form.userLimit) } }, { onSuccess: () => { toast.success("Package updated"); setEditing(null); } })}>Save changes</Button></DialogFooter></DialogContent></Dialog></PlatformShell>;
}

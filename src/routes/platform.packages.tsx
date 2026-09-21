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
import { useCreatePackage, useSubscriptionPackages, useUpdatePackage } from "@/hooks/queries/platform";
import type { PackageInput, SubscriptionPackage } from "@/services/platform";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/platform/packages")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" });
  },
  component: PackagesPage,
});

type PackageForm = {
  name: string;
  description: string;
  basePrice: string;
  billingPeriod: PackageInput["billingPeriod"] | "";
  packageDays: string;
  trialDays: string;
  setupFee: string;
  recommended: boolean;
};

const EMPTY_FORM: PackageForm = {
  name: "",
  description: "",
  basePrice: "",
  billingPeriod: "",
  packageDays: "",
  trialDays: "",
  setupFee: "",
  recommended: false,
};

function formFromPackage(pkg: SubscriptionPackage): PackageForm {
  return {
    name: pkg.name,
    description: pkg.description,
    basePrice: String(pkg.basePrice),
    billingPeriod: pkg.billingPeriod,
    packageDays: String(pkg.packageDays),
    trialDays: String(pkg.trialDays),
    setupFee: String(pkg.setupFee),
    recommended: pkg.recommended,
  };
}

function toInput(form: PackageForm): PackageInput {
  if (!form.billingPeriod) throw new Error("Billing period is required");
  return {
    name: form.name,
    description: form.description,
    basePrice: Number(form.basePrice),
    billingPeriod: form.billingPeriod,
    packageDays: Number(form.packageDays),
    trialDays: Number(form.trialDays),
    setupFee: Number(form.setupFee),
    recommended: form.recommended,
  };
}

function PackagesPage() {
  const { data: packages = [], isLoading, isError } = useSubscriptionPackages();
  const create = useCreatePackage();
  const update = useUpdatePackage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const isPending = create.isPending || update.isPending;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (pkg: SubscriptionPackage) => {
    setEditing(pkg);
    setForm(formFromPackage(pkg));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const save = () => {
    const input = toInput(form);
    const onSuccess = () => {
      toast.success(editing ? "Package updated" : "Package created");
      close();
    };
    const onError = (error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to save package");
    if (editing) update.mutate({ id: editing.id, input }, { onSuccess, onError });
    else create.mutate(input, { onSuccess, onError });
  };

  return (
    <PlatformShell>
      <PageHeader
        title="Subscription packages"
        description="Configure plans, pricing, billing periods and feature access."
        actions={<Button onClick={openCreate}><Plus className="size-4" /> New package</Button>}
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading packages...</p>}
      {isError && <p className="text-sm text-destructive">Unable to load packages. Please try again.</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{pkg.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{pkg.billingPeriod.toLowerCase()} · {pkg.packageDays} days</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Edit ${pkg.name}`} onClick={() => openEdit(pkg)}><Pencil className="size-4" /></Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{pkg.description}</p>
            <p className="numeric mt-6 text-3xl font-semibold">{formatCurrency(pkg.basePrice)}<span className="text-sm font-normal text-muted-foreground"> / {pkg.billingPeriod.toLowerCase()}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{pkg.trialDays}-day trial · {pkg.setupFee ? `${formatCurrency(pkg.setupFee)} setup fee` : "No setup fee"}</p>
            <ul className="mt-6 space-y-3 border-t pt-5 text-sm">
              {pkg.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="size-4 text-success" />{feature}</li>)}
            </ul>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit package" : "Create package"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Input className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Base price</Label><Input className="mt-1.5" type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
            <div><Label>Billing period</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value as PackageForm["billingPeriod"] })}><option value="">Select a billing period</option>{["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME", "ONE_TIME"].map((period) => <option key={period}>{period}</option>)}</select></div>
            <div><Label>Package days</Label><Input className="mt-1.5" type="number" min="0" value={form.packageDays} onChange={(e) => setForm({ ...form, packageDays: e.target.value })} /></div>
            <div><Label>Trial days</Label><Input className="mt-1.5" type="number" min="0" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} /></div>
            <div><Label>Setup fee</Label><Input className="mt-1.5" type="number" min="0" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button disabled={isPending || !form.name.trim() || !form.description.trim() || !form.billingPeriod || !form.basePrice || !form.packageDays || !form.trialDays || !form.setupFee} onClick={save}>{isPending ? "Saving..." : editing ? "Save changes" : "Create package"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformShell>
  );
}

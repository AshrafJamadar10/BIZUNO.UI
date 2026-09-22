import { createFileRoute, redirect } from "@tanstack/react-router";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePackage, usePackageScopes, useSubscriptionPackages, useUpdatePackage } from "@/hooks/queries/platform";
import type { FeatureLimitType, PackageFeature, PackageInput, PackageOperation, PackageScope, SubscriptionPackage } from "@/services/platform";
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
  features: PackageFeature[];
};

const OPERATIONS: PackageOperation[] = ["CREATE", "READ", "UPDATE", "DELETE"];
const LIMIT_TYPES: FeatureLimitType[] = ["NONE", "COUNT", "AMOUNT", "STORAGE"];

const newFeature = (displayOrder: number, scope: PackageScope = "DASHBOARD"): PackageFeature => ({
  featureCode: "",
  featureName: "",
  description: "",
  scope,
  operations: ["READ"],
  limitType: "NONE",
  limitValue: 0,
  unit: "",
  isEnabled: true,
  displayOrder,
});

const EMPTY_FORM: PackageForm = {
  name: "",
  description: "",
  basePrice: "",
  billingPeriod: "",
  packageDays: "",
  trialDays: "",
  setupFee: "",
  recommended: false,
  features: [newFeature(0)],
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
    features: pkg.features.map((feature, index) => ({ ...feature, displayOrder: feature.displayOrder ?? index })),
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
    features: form.features.map((feature, index) => ({
      ...feature,
      featureCode: feature.featureCode.trim(),
      featureName: feature.featureName.trim(),
      description: feature.description.trim(),
      displayOrder: index,
    })),
  };
}

function PackagesPage() {
  const { data: packages = [], isLoading, isError } = useSubscriptionPackages();
  const create = useCreatePackage();
  const update = useUpdatePackage();
  const { data: scopes = [], isLoading: scopesLoading } = usePackageScopes();
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

  const updateFeature = (index: number, patch: Partial<PackageFeature>) =>
    setForm((current) => ({ ...current, features: current.features.map((feature, featureIndex) => featureIndex === index ? { ...feature, ...patch } : feature) }));

  const toggleOperation = (index: number, operation: PackageOperation) => {
    const feature = form.features[index];
    const operations = feature.operations.includes(operation)
      ? feature.operations.filter((item) => item !== operation)
      : [...feature.operations, operation];
    updateFeature(index, { operations });
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
              {pkg.features.map((feature) => <li key={feature.featureCode || feature.featureName} className="flex items-center gap-2"><Check className="size-4 text-success" />{feature.featureName}</li>)}
            </ul>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{editing ? "Edit package" : "Create package"}</DialogTitle></DialogHeader>
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Input className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Base price</Label><Input className="mt-1.5" type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
            <div><Label>Billing period</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value as PackageForm["billingPeriod"] })}><option value="">Select a billing period</option>{["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME", "ONE_TIME"].map((period) => <option key={period}>{period}</option>)}</select></div>
            <div><Label>Package days</Label><Input className="mt-1.5" type="number" min="0" value={form.packageDays} onChange={(e) => setForm({ ...form, packageDays: e.target.value })} /></div>
            <div><Label>Trial days</Label><Input className="mt-1.5" type="number" min="0" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} /></div>
            <div><Label>Setup fee</Label><Input className="mt-1.5" type="number" min="0" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} /></div>
            <div className="flex items-center gap-2 sm:col-span-2"><input id="recommended" type="checkbox" checked={form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} /><Label htmlFor="recommended">Recommended package</Label></div>
            <div className="border-t pt-3 sm:col-span-2"><div className="mb-3 flex items-center justify-between"><div><h3 className="font-medium">Package features</h3><p className="text-xs text-muted-foreground">Scopes and operations are validated by the backend.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, features: [...form.features, newFeature(form.features.length, scopes[0] ?? "DASHBOARD")] })}><Plus className="size-4" /> Add feature</Button></div>
              <div className="space-y-4">{form.features.map((feature, index) => <div key={`${index}-${feature.featureCode}`} className="rounded-md border p-3"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium">Feature {index + 1}</span><Button type="button" variant="ghost" size="icon" aria-label={`Remove feature ${index + 1}`} disabled={form.features.length === 1} onClick={() => setForm({ ...form, features: form.features.filter((_, featureIndex) => featureIndex !== index) })}><Trash2 className="size-4" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Feature code</Label><Input className="mt-1.5" value={feature.featureCode} onChange={(e) => updateFeature(index, { featureCode: e.target.value })} placeholder="INVENTORY_ACCESS" /></div><div><Label>Feature name</Label><Input className="mt-1.5" value={feature.featureName} onChange={(e) => updateFeature(index, { featureName: e.target.value })} placeholder="Inventory access" /></div><div className="sm:col-span-2"><Label>Description</Label><Input className="mt-1.5" value={feature.description} onChange={(e) => updateFeature(index, { description: e.target.value })} /></div><div><Label>Scope</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={feature.scope} disabled={scopesLoading} onChange={(e) => updateFeature(index, { scope: e.target.value as PackageScope })}>{scopes.map((scope) => <option key={scope} value={scope}>{scope}</option>)}</select></div><div><Label>Limit type</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={feature.limitType} onChange={(e) => updateFeature(index, { limitType: e.target.value as FeatureLimitType })}>{LIMIT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div><div><Label>Limit value</Label><Input className="mt-1.5" type="number" min="0" value={feature.limitValue} onChange={(e) => updateFeature(index, { limitValue: Number(e.target.value) })} /></div><div><Label>Unit</Label><Input className="mt-1.5" value={feature.unit} onChange={(e) => updateFeature(index, { unit: e.target.value })} placeholder="users, invoices, GB" /></div><div className="flex items-center gap-4 sm:col-span-2"><span className="text-sm font-medium">Operations</span>{OPERATIONS.map((operation) => <label key={operation} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={feature.operations.includes(operation)} onChange={() => toggleOperation(index, operation)} />{operation}</label>)}<label className="ml-auto flex items-center gap-1.5 text-xs"><input type="checkbox" checked={feature.isEnabled} onChange={(e) => updateFeature(index, { isEnabled: e.target.checked })} />Enabled</label></div></div></div>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button disabled={isPending || !form.name.trim() || !form.description.trim() || !form.billingPeriod || !form.basePrice || !form.packageDays || !form.trialDays || !form.setupFee || form.features.some((feature) => !feature.featureCode.trim() || !feature.featureName.trim() || feature.operations.length === 0)} onClick={save}>{isPending ? "Saving..." : editing ? "Save changes" : "Create package"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformShell>
  );
}

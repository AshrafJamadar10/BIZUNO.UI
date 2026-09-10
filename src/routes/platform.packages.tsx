import { createFileRoute, redirect } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscriptionPackages } from "@/hooks/queries/platform";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/platform/packages")({ beforeLoad: () => { if (window.localStorage.getItem("biznexus-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" }); }, component: PackagesPage });
function PackagesPage() {
  const { data: packages = [] } = useSubscriptionPackages();
  return <PlatformShell><PageHeader title="Subscription packages" description="Configure plans, pricing, limits and feature access." actions={<Button><Plus className="size-4" /> New package</Button>} /><div className="grid gap-4 lg:grid-cols-3">{packages.map((pkg) => <Card key={pkg.id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{pkg.name}</h2><p className="mt-1 text-sm text-muted-foreground">{pkg.activeTenants} active tenants</p></div><span className="rounded-full bg-success/12 px-2 py-1 text-xs text-success">{pkg.status}</span></div><p className="numeric mt-6 text-3xl font-semibold">{formatCurrency(pkg.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p><p className="mt-1 text-xs text-muted-foreground">{formatCurrency(pkg.annualPrice)} billed annually · up to {formatNumber(pkg.userLimit)} users</p><ul className="mt-6 space-y-3 border-t pt-5 text-sm">{pkg.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="size-4 text-success" />{feature}</li>)}</ul></Card>)}</div></PlatformShell>;
}

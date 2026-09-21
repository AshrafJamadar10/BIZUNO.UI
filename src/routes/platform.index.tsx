import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Building2, CreditCard, DollarSign, Users } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { usePlatformTenants, useSubscriptionPackages } from "@/hooks/queries/platform";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/platform/")({ beforeLoad: () => { if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" }); }, component: PlatformDashboard });
function PlatformDashboard() {
  const { data: tenants = [] } = usePlatformTenants(); const { data: packages = [] } = useSubscriptionPackages();
  const active = tenants.filter((tenant) => tenant.status === "active").length; const mrr = packages.reduce((sum, pkg) => sum + pkg.monthlyPrice * pkg.activeTenants, 0);
  return <PlatformShell><PageHeader title="Platform dashboard" description="Monitor businesses, subscriptions and platform growth." actions={<Link to="/platform/tenants" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Create business</Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total businesses" value={formatNumber(tenants.length)} icon={Building2} /><StatCard label="Active tenants" value={formatNumber(active)} icon={Users} /><StatCard label="Subscription MRR" value={formatCurrency(mrr)} icon={DollarSign} /><StatCard label="Packages" value={formatNumber(packages.length)} icon={CreditCard} /></div><div className="mt-6 grid gap-4 lg:grid-cols-2"><Card className="p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent businesses</h2><Link to="/platform/tenants" className="text-sm text-primary hover:underline">View all</Link></div><div className="mt-4 space-y-3">{tenants.slice(0, 5).map((tenant) => <div key={tenant.id} className="flex items-center justify-between border-b pb-3 last:border-0"><div><p className="font-medium">{tenant.businessName}</p><p className="text-xs text-muted-foreground">{tenant.ownerName} · {tenant.plan}</p></div><span className="text-xs capitalize text-muted-foreground">{tenant.status}</span></div>)}</div></Card><Card className="p-5"><h2 className="font-semibold">Package performance</h2><div className="mt-4 space-y-4">{packages.map((pkg) => <div key={pkg.id}><div className="flex justify-between text-sm"><span>{pkg.name}</span><span>{pkg.activeTenants} tenants</span></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pkg.activeTenants * 2)}%` }} /></div></div>)}</div></Card></div></PlatformShell>;
}

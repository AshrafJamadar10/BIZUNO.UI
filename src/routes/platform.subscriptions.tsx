import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenantSubscriptions } from "@/hooks/queries/platform";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/platform/subscriptions")({ beforeLoad: () => { if (window.localStorage.getItem("biznexus-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" }); }, component: SubscriptionsPage });

function SubscriptionsPage() {
  const { data: subscriptions = [] } = useTenantSubscriptions();
  return <PlatformShell><PageHeader title="Subscriptions" description="Review tenant subscription plans, payments and renewal dates." /><Card className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Package</TableHead><TableHead>Subscribed date</TableHead><TableHead>Paid amount</TableHead><TableHead>Billing</TableHead><TableHead>Expires date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{subscriptions.map((subscription) => <TableRow key={subscription.id}><TableCell><p className="font-medium">{subscription.businessName}</p><p className="text-xs text-muted-foreground">{subscription.tenantId}</p></TableCell><TableCell>{subscription.packageName}</TableCell><TableCell>{formatDate(subscription.subscribedAt)}</TableCell><TableCell className="numeric">{subscription.paidAmount ? formatCurrency(subscription.paidAmount) : "Trial"}</TableCell><TableCell className="capitalize">{subscription.billingCycle}</TableCell><TableCell>{formatDate(subscription.expiresAt)}</TableCell><TableCell><StatusBadge status={subscription.status} /></TableCell></TableRow>)}</TableBody></Table></div></Card><div className="flex items-center gap-2 text-sm text-muted-foreground"><CreditCard className="size-4" /> Payment reconciliation will connect to the backend billing provider later.</div></PlatformShell>;
}

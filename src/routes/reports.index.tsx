import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMetrics, useSalesSeries } from "@/hooks/queries/dashboard";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/reports/")({ component: ReportsPage });
function ReportsPage() {
  const { data: metrics = [] } = useMetrics("year"); const { data: series = [] } = useSalesSeries();
  const max = Math.max(...series.map((point) => point.sales), 1);
  return <AppShell><PageHeader title="Reports" description="Understand sales performance, profitability and cash flow at a glance." crumbs={[{ label: "Home", to: "/" }, { label: "Reports" }]} actions={<Button variant="outline" onClick={() => window.print()}><Download className="size-4" /> Export report</Button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.slice(0, 4).map((metric) => <Card key={metric.key} className="p-5"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="numeric mt-2 text-2xl font-semibold">{formatCurrency(metric.value)}</p><p className="mt-1 text-xs text-muted-foreground">{metric.change}% vs previous period</p></Card>)}</div><Card className="p-5"><div className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" /><h2 className="font-semibold">Sales trend</h2></div><div className="mt-6 space-y-3">{series.map((point) => <div key={point.label} className="grid grid-cols-[2rem_1fr_7rem] items-center gap-3 text-sm"><span className="text-muted-foreground">{point.label}</span><div className="h-6 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${(point.sales / max) * 100}%` }} /></div><span className="numeric text-right">{formatCurrency(point.sales, { compact: true })}</span></div>)}</div></Card></AppShell>;
}

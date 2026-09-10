import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, IndianRupee, Receipt, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCategoryBreakdown,
  useLowStockProducts,
  useMetrics,
  useOutstandingCustomers,
  usePaymentStatusBreakdown,
  useRecentActivity,
  useRecentTransactions,
  useSalesSeries,
} from "@/hooks/queries/dashboard";
import { stockStatusOf } from "@/services/inventory";
import type { DateRangeKey } from "@/services/dashboard";
import { formatCurrency, formatDate, formatNumber, relativeTime } from "@/utils/format";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (!window.localStorage.getItem("bizuno-demo-role")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — BizUno Business Management" },
      {
        name: "description",
        content:
          "Track sales, receivables, inventory health and team activity across your business in one BizUno dashboard.",
      },
      { property: "og:title", content: "Dashboard — BizUno Business Management" },
      {
        property: "og:description",
        content: "Live sales, receivables and inventory insights for your business workspace.",
      },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const ICONS = [IndianRupee, Receipt, Users, TrendingUp];

function DashboardPage() {
  const [range, setRange] = useState<DateRangeKey>("month");
  const { data: metrics, isLoading } = useMetrics(range);
  const { data: series = [] } = useSalesSeries();
  const { data: categories = [] } = useCategoryBreakdown();
  const { data: statusMix = [] } = usePaymentStatusBreakdown();
  const { data: transactions = [] } = useRecentTransactions();
  const { data: lowStock = [] } = useLowStockProducts();
  const { data: outstanding = [] } = useOutstandingCustomers();
  const { data: activity = [] } = useRecentActivity();

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="A live view of revenue, receivables and stock health."
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !metrics
          ? [0, 1, 2, 3].map((i) => <StatCard key={i} label="" value="" loading />)
          : metrics.map((m, i) => (
              <StatCard
                key={m.key}
                label={m.label}
                value={m.kind === "currency" ? formatCurrency(m.value) : formatNumber(m.value)}
                change={m.change}
                hint="vs previous period"
                icon={ICONS[i % ICONS.length]}
              />
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Revenue trend</h2>
          <p className="text-xs text-muted-foreground">Sales, purchases and expenses by month</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--chart-1)"
                  fill="url(#rev)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--chart-4)"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Receivables mix</h2>
          <p className="text-xs text-muted-foreground">Invoice value by payment status</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82}>
                  {statusMix.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-xs">
            {statusMix.map((entry, i) => (
              <li key={entry.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {entry.name}
                </span>
                <span className="numeric">{formatCurrency(entry.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent transactions</h2>
            <Link to="/sales" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.reference}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.kind} · {t.party} · {formatDate(t.at)}
                  </p>
                </div>
                <span className="numeric text-sm font-semibold">{formatCurrency(t.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Sales by category</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 12 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-warning" /> Low stock alerts
          </h2>
          <ul className="mt-3 space-y-3">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.stock} left · min {p.minStock}
                  </p>
                </div>
                <StatusBadge status={stockStatusOf(p)} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Top outstanding customers</h2>
          <ul className="mt-3 space-y-3">
            {outstanding.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: c.id }}
                  className="min-w-0 text-sm font-medium hover:underline"
                >
                  <span className="block truncate">{c.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{c.city}</span>
                </Link>
                <span className="numeric text-sm font-semibold text-destructive">
                  {formatCurrency(c.outstanding)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <ul className="mt-3 space-y-3">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="text-sm">
                <p className="font-medium">{a.user}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                <p className="text-[11px] text-muted-foreground/80">{relativeTime(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

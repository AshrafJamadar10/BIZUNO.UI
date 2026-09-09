import { activities, customers, invoices, payments, products } from "@/services/apis/db";
import { request } from "@/services/apis/client";
import { stockStatusOf } from "@/services/inventory";
import type { ActivityEntry, DashboardMetric, SeriesPoint } from "@/types";

export type DateRangeKey = "today" | "week" | "month" | "quarter" | "year";

const FACTOR: Record<DateRangeKey, number> = {
  today: 0.05,
  week: 0.22,
  month: 1,
  quarter: 2.7,
  year: 9.4,
};

export function getMetrics(range: DateRangeKey = "month"): Promise<DashboardMetric[]> {
  return request(() => {
    const f = FACTOR[range];
    const live = invoices.filter((i) => i.orderStatus !== "cancelled");
    const sales = live.reduce((s, i) => s + i.total, 0) * f;
    const purchases = sales * 0.63;
    const expenses = sales * 0.14;
    const receivables = live.reduce((s, i) => s + i.balance, 0);
    const stockValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);

    return [
      { key: "sales", label: "Total Sales", value: sales, change: 12.4, kind: "currency" },
      { key: "purchases", label: "Total Purchases", value: purchases, change: 6.1, kind: "currency" },
      { key: "revenue", label: "Revenue", value: sales - purchases, change: 18.2, kind: "currency" },
      { key: "expenses", label: "Expenses", value: expenses, change: -4.3, kind: "currency" },
      { key: "receivables", label: "Receivables", value: receivables, change: 3.8, kind: "currency" },
      { key: "payables", label: "Payables", value: purchases * 0.21, change: -2.2, kind: "currency" },
      { key: "stock", label: "Stock Value", value: stockValue, change: 5.5, kind: "currency" },
      {
        key: "profit",
        label: "Net Profit",
        value: sales - purchases - expenses,
        change: 21.7,
        kind: "currency",
      },
    ];
  });
}

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export function getSalesSeries(): Promise<SeriesPoint[]> {
  return request(() =>
    MONTHS.map((label, i) => {
      const base = 1850000 + Math.round(Math.sin(i / 1.6) * 520000) + i * 74000;
      const purchases = Math.round(base * 0.62);
      const expenses = Math.round(base * 0.15);
      return { label, sales: base, purchases, expenses, revenue: base - purchases };
    }),
  );
}

export function getTopProducts() {
  return request(() => {
    const tally = new Map<string, { name: string; units: number; revenue: number }>();
    for (const inv of invoices) {
      if (inv.orderStatus === "cancelled") continue;
      for (const item of inv.items) {
        const entry = tally.get(item.productId) ?? {
          name: item.productName,
          units: 0,
          revenue: 0,
        };
        entry.units += item.quantity;
        entry.revenue += item.total;
        tally.set(item.productId, entry);
      }
    }
    return [...tally.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  });
}

export function getCategoryBreakdown() {
  return request(() => {
    const tally = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.orderStatus === "cancelled") continue;
      for (const item of inv.items) {
        const product = products.find((p) => p.id === item.productId);
        const key = product?.categoryName ?? "Other";
        tally.set(key, (tally.get(key) ?? 0) + item.total);
      }
    }
    return [...tally.entries()].map(([name, value]) => ({ name, value: Math.round(value) }));
  });
}

export function getPaymentStatusBreakdown() {
  return request(() => {
    const buckets = { Paid: 0, Partial: 0, Pending: 0, Overdue: 0 };
    for (const inv of invoices) {
      if (inv.paymentStatus === "paid") buckets.Paid += inv.total;
      if (inv.paymentStatus === "partial") buckets.Partial += inv.balance;
      if (inv.paymentStatus === "pending") buckets.Pending += inv.balance;
      if (inv.paymentStatus === "overdue") buckets.Overdue += inv.balance;
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value: Math.round(value) }));
  });
}

export function getRecentTransactions() {
  return request(() => {
    const rows = [
      ...invoices.slice(0, 5).map((i) => ({
        id: i.id,
        kind: "Sale" as const,
        reference: i.number,
        party: i.customerName,
        amount: i.total,
        at: i.issuedAt,
      })),
      ...payments.slice(0, 4).map((p) => ({
        id: p.id,
        kind: "Payment" as const,
        reference: p.reference,
        party: p.partyName,
        amount: p.amount,
        at: p.receivedAt,
      })),
    ];
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 7);
  });
}

export function getLowStockProducts() {
  return request(() =>
    products
      .filter((p) => stockStatusOf(p) !== "in_stock")
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6),
  );
}

export function getOutstandingCustomers() {
  return request(() =>
    customers
      .filter((c) => c.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5),
  );
}

export function getRecentActivity(): Promise<ActivityEntry[]> {
  return request(() => activities);
}

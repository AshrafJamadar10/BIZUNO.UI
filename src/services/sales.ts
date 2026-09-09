import { customers, invoices, products, totalsFor } from "@/services/apis/db";
import { matches, paginate, request, sortRows } from "@/services/apis/client";
import type { ID, Invoice, LineItem, ListQuery, Paginated } from "@/types";

export interface SalesSummary {
  totalSales: number;
  paid: number;
  pending: number;
  overdue: number;
  invoiceCount: number;
}

export function getSalesSummary(): Promise<SalesSummary> {
  return request(() => {
    const live = invoices.filter((i) => i.orderStatus !== "cancelled");
    return {
      totalSales: live.reduce((s, i) => s + i.total, 0),
      paid: live.reduce((s, i) => s + i.paid, 0),
      pending: live
        .filter((i) => i.paymentStatus === "pending" || i.paymentStatus === "partial")
        .reduce((s, i) => s + i.balance, 0),
      overdue: live.filter((i) => i.paymentStatus === "overdue").reduce((s, i) => s + i.balance, 0),
      invoiceCount: live.length,
    };
  });
}

export function listInvoices(query: ListQuery = {}): Promise<Paginated<Invoice>> {
  return request(() => {
    let rows = invoices.filter((i) =>
      matches([i.number, i.customerName, i.salesperson], query.search),
    );
    if (query.status && query.status !== "all")
      rows = rows.filter((i) => i.paymentStatus === query.status);
    rows = sortRows(rows, query.sortBy ?? "issuedAt", query.sortDir ?? "desc");
    return paginate(rows, query);
  });
}

export function getInvoice(id: ID): Promise<Invoice | undefined> {
  return request(() => invoices.find((i) => i.id === id || i.number === id));
}

export interface DraftLine {
  productId: ID;
  quantity: number;
  discountPercent: number;
}

export interface CreateSaleInput {
  customerId: ID;
  lines: DraftLine[];
  dueInDays: number;
  salesperson: string;
  amountPaid: number;
  notes?: string;
}

export function buildLineItems(lines: DraftLine[]): LineItem[] {
  return lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return [];
    const gross = product.sellingPrice * line.quantity;
    return [
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: line.quantity,
        unitPrice: product.sellingPrice,
        discountPercent: line.discountPercent,
        taxRate: product.taxRate,
        total: gross - (gross * line.discountPercent) / 100,
      },
    ];
  });
}

export function previewTotals(lines: DraftLine[]) {
  return totalsFor(buildLineItems(lines));
}

export function createSale(input: CreateSaleInput): Promise<Invoice> {
  return request(() => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) throw new Error("Customer not found");
    const items = buildLineItems(input.lines);
    if (items.length === 0) throw new Error("Add at least one product");
    const t = totalsFor(items);
    const total = Math.round(t.total);
    const paid = Math.min(Math.round(input.amountPaid), total);
    const balance = total - paid;
    const nextNumber = `INV-2026-${String(124 + invoices.length).padStart(5, "0")}`;

    const invoice: Invoice = {
      id: `inv-${invoices.length + 1}-${Date.now()}`,
      number: nextNumber,
      customerId: customer.id,
      customerName: customer.name,
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + input.dueInDays * 86400000).toISOString(),
      items,
      subtotal: Math.round(t.subtotal),
      discount: Math.round(t.discount),
      tax: Math.round(t.tax),
      total,
      paid,
      balance,
      paymentStatus: balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending",
      orderStatus: "confirmed",
      salesperson: input.salesperson,
      notes: input.notes,
    };

    invoices.unshift(invoice);
    customer.totalPurchases += total;
    customer.outstanding += balance;
    customer.lastPurchaseAt = invoice.issuedAt;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) product.stock = Math.max(0, product.stock - item.quantity);
    }

    return invoice;
  });
}

export function cancelInvoice(id: ID): Promise<void> {
  return request(() => {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) return;
    invoice.orderStatus = "cancelled";
    invoice.paymentStatus = "cancelled";
  });
}

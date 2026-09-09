import { customers, invoices, payments } from "@/services/apis/db";
import { matches, paginate, request, sortRows } from "@/services/apis/client";
import type { ID, ListQuery, Paginated, Payment, PaymentMethod } from "@/types";

export function listPayments(query: ListQuery = {}): Promise<Paginated<Payment>> {
  return request(() => {
    let rows = payments.filter((p) =>
      matches([p.reference, p.partyName, p.invoiceNumber], query.search),
    );
    if (query.status && query.status !== "all") rows = rows.filter((p) => p.method === query.status);
    rows = sortRows(rows, query.sortBy ?? "receivedAt", query.sortDir ?? "desc");
    return paginate(rows, query);
  });
}

export interface RecordPaymentInput {
  invoiceId: ID;
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export function recordPayment(input: RecordPaymentInput): Promise<Payment> {
  return request(() => {
    const invoice = invoices.find((i) => i.id === input.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    const amount = Math.min(input.amount, invoice.balance);
    invoice.paid += amount;
    invoice.balance -= amount;
    invoice.paymentStatus = invoice.balance <= 0 ? "paid" : "partial";

    const customer = customers.find((c) => c.id === invoice.customerId);
    if (customer) customer.outstanding = Math.max(0, customer.outstanding - amount);

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      reference: `PAY-2026-${String(3011 + payments.length).padStart(5, "0")}`,
      partyType: "customer",
      partyId: invoice.customerId,
      partyName: invoice.customerName,
      invoiceNumber: invoice.number,
      amount,
      method: input.method,
      receivedAt: new Date().toISOString(),
      status: "completed",
      note: input.note,
    };
    payments.unshift(payment);
    return payment;
  });
}

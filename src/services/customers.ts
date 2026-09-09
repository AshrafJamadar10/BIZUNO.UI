import { customers, invoices, nextId, payments } from "@/services/apis/db";
import { matches, paginate, request, sortRows } from "@/services/apis/client";
import type { Customer, CustomerInput, ID, ListQuery, Paginated } from "@/types";

export function listCustomers(query: ListQuery = {}): Promise<Paginated<Customer>> {
  return request(() => {
    let rows = customers.filter((c) =>
      matches([c.name, c.email, c.phone, c.city, c.gstin, c.contactPerson], query.search),
    );
    if (query.status && query.status !== "all") rows = rows.filter((c) => c.status === query.status);
    rows = sortRows(rows, query.sortBy ?? "name", query.sortDir ?? "asc");
    return paginate(rows, query);
  });
}

export function getCustomer(id: ID): Promise<Customer | undefined> {
  return request(() => customers.find((c) => c.id === id));
}

export function getCustomerInvoices(id: ID) {
  return request(() => invoices.filter((i) => i.customerId === id));
}

export function getCustomerPayments(id: ID) {
  return request(() => payments.filter((p) => p.partyId === id));
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return request(() => {
    const customer: Customer = {
      ...input,
      id: nextId("cus"),
      totalPurchases: 0,
      outstanding: 0,
      lastPurchaseAt: null,
      createdAt: new Date().toISOString(),
    };
    customers.unshift(customer);
    return customer;
  });
}

export function updateCustomer(id: ID, input: Partial<CustomerInput>): Promise<Customer> {
  return request(() => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) throw new Error("Customer not found");
    Object.assign(existing, input);
    return existing;
  });
}

export function deleteCustomer(id: ID): Promise<void> {
  return request(() => {
    const idx = customers.findIndex((c) => c.id === id);
    if (idx >= 0) customers.splice(idx, 1);
  });
}

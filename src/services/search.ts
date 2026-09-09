import { customers, invoices, products } from "@/services/apis/db";
import { request } from "@/services/apis/client";

export interface SearchHit {
  id: string;
  label: string;
  meta: string;
  to: string;
  params?: Record<string, string>;
}

export interface SearchGroup {
  group: string;
  hits: SearchHit[];
}

export function globalSearch(term: string): Promise<SearchGroup[]> {
  return request(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];

    const productHits = products
      .filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        label: p.name,
        meta: p.sku,
        to: "/products/$productId",
        params: { productId: p.id },
      }));

    const customerHits = customers
      .filter((c) => `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        label: c.name,
        meta: `${c.city} · ${c.phone}`,
        to: "/customers/$customerId",
        params: { customerId: c.id },
      }));

    const invoiceHits = invoices
      .filter((i) => `${i.number} ${i.customerName}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        label: i.number,
        meta: i.customerName,
        to: "/invoices/$invoiceId",
        params: { invoiceId: i.id },
      }));

    return [
      { group: "Products", hits: productHits },
      { group: "Customers", hits: customerHits },
      { group: "Invoices", hits: invoiceHits },
    ].filter((g) => g.hits.length > 0);
  }, 180);
}

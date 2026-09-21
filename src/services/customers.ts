import { request } from "@/services/apis/client";
import { getStoredBusinessCode } from "@/lib/auth";
import type { Customer, CustomerInput, ID, Invoice, ListQuery, Paginated, Payment } from "@/types";

type BackendPage<T> = { content: T[]; page: number; size: number; totalElements: number };
type CustomerDTO = { customerId: string; name: string; contactPerson?: string; email?: string; phone?: string; city?: string; address?: string; gstNumber?: string; outstandingBalance?: number; status?: string };
const path = () => `/bizuno/business/${encodeURIComponent(getStoredBusinessCode())}/customer`;
const map = (item: CustomerDTO): Customer => ({ id: item.customerId, name: item.name, contactPerson: item.contactPerson ?? "", email: item.email ?? "", phone: item.phone ?? "", city: item.city ?? "", address: item.address ?? "", gstin: item.gstNumber, totalPurchases: 0, outstanding: Number(item.outstandingBalance ?? 0), lastPurchaseAt: null, status: item.status?.toLowerCase() === "inactive" ? "inactive" : "active", createdAt: "" });
const page = (data: BackendPage<CustomerDTO>): Paginated<Customer> => ({ rows: data.content.map(map), total: data.totalElements, page: data.page + 1, pageSize: data.size });
const body = (input: Partial<CustomerInput>) => ({ name: input.name, contactPerson: input.contactPerson, email: input.email || undefined, phone: input.phone || undefined, city: input.city || undefined, address: input.address || undefined, gstNumber: input.gstin || undefined });
const ensureCode = () => { if (!getStoredBusinessCode()) throw new Error("Business session is missing. Please sign in again."); };

export async function listCustomers(query: ListQuery = {}): Promise<Paginated<Customer>> {
  ensureCode();
  const params = new URLSearchParams({ page: String(Math.max(0, (query.page ?? 1) - 1)), size: String(query.pageSize ?? 10), sortBy: query.sortBy ?? "name", sortDirection: query.sortDir === "desc" ? "desc" : "ASC" });
  const response = await request<BackendPage<CustomerDTO>>(`${path()}?${params}`);
  const result = page(response);
  if (!query.search?.trim()) return result;
  const search = query.search.toLowerCase();
  return { ...result, rows: result.rows.filter((item) => [item.name, item.email, item.phone, item.city, item.gstin].some((value) => value?.toLowerCase().includes(search))) };
}
export async function getCustomer(id: ID): Promise<Customer | undefined> { ensureCode(); return map(await request<CustomerDTO>(`${path()}/${id}`)); }
export async function getCustomerInvoices(_id: ID): Promise<Invoice[]> { return []; }
export async function getCustomerPayments(_id: ID): Promise<Payment[]> { return []; }
export async function createCustomer(input: CustomerInput): Promise<Customer> { ensureCode(); return map(await request<CustomerDTO>(path(), { method: "POST", body: JSON.stringify(body(input)) })); }
export async function updateCustomer(id: ID, input: Partial<CustomerInput>): Promise<Customer> { ensureCode(); return map(await request<CustomerDTO>(`${path()}/${id}`, { method: "PUT", body: JSON.stringify(body(input)) })); }
export async function deleteCustomer(id: ID): Promise<void> { ensureCode(); await request<unknown>(`${path()}/${id}`, { method: "DELETE" }); }

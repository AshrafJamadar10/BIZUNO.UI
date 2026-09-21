import { request } from "@/services/apis/client";
import { getStoredBusinessCode } from "@/lib/auth";
import type { ID, ListQuery, Paginated, PurchaseOrder, Supplier } from "@/types";
type BackendPage<T> = { content: T[]; page: number; size: number; totalElements: number };
type SupplierDTO = { supplierId: string; name: string; contactPerson?: string; email?: string; phone?: string; city?: string; address?: string; gstNumber?: string; outstandingBalance?: number; status?: string };
const path = () => `/bizuno/business/${encodeURIComponent(getStoredBusinessCode())}/supplier`;
const map = (item: SupplierDTO): Supplier => ({ id: item.supplierId, name: item.name, contactPerson: item.contactPerson ?? "", email: item.email ?? "", phone: item.phone ?? "", gstin: item.gstNumber, city: item.city ?? "", outstanding: Number(item.outstandingBalance ?? 0), status: item.status?.toLowerCase() === "inactive" ? "inactive" : "active", createdAt: "" });
const body = (input: Partial<Supplier>) => ({ name: input.name, contactPerson: input.contactPerson || undefined, email: input.email || undefined, phone: input.phone || undefined, city: input.city || undefined, address: input.address || undefined, gstNumber: input.gstin || undefined });
const ensureCode = () => { if (!getStoredBusinessCode()) throw new Error("Business session is missing. Please sign in again."); };
export async function listSuppliers(query: ListQuery = {}): Promise<Paginated<Supplier>> { ensureCode(); const params = new URLSearchParams({ page: String(Math.max(0, (query.page ?? 1) - 1)), size: String(query.pageSize ?? 10), sortBy: query.sortBy ?? "name", sortDirection: query.sortDir === "desc" ? "desc" : "ASC" }); const result = await request<BackendPage<SupplierDTO>>(`${path()}?${params}`); const rows = result.content.map(map); const search = query.search?.toLowerCase().trim(); return { rows: search ? rows.filter((item) => [item.name, item.contactPerson, item.email, item.phone, item.city].some((value) => value?.toLowerCase().includes(search))) : rows, total: result.totalElements, page: result.page + 1, pageSize: result.size }; }
type SupplierInput = Omit<Supplier, "id" | "createdAt" | "outstanding" | "status">;
export async function createSupplier(input: SupplierInput): Promise<Supplier> { ensureCode(); return map(await request<SupplierDTO>(path(), { method: "POST", body: JSON.stringify(body(input)) })); }
export async function updateSupplier(id: ID, input: Partial<SupplierInput>): Promise<Supplier> { ensureCode(); return map(await request<SupplierDTO>(`${path()}/${id}`, { method: "PUT", body: JSON.stringify(body(input)) })); }
export async function deleteSupplier(id: ID): Promise<void> { ensureCode(); await request<unknown>(`${path()}/${id}`, { method: "DELETE" }); }
export async function listPurchaseOrders(_query: ListQuery = {}): Promise<Paginated<PurchaseOrder>> { return { rows: [], total: 0, page: 1, pageSize: 10 }; }
export async function getSupplier(id: ID): Promise<Supplier | undefined> { ensureCode(); return map(await request<SupplierDTO>(`${path()}/${id}`)); }

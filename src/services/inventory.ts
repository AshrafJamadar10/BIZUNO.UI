import { request } from "@/services/apis/client";
import { getStoredBusinessCode } from "@/lib/auth";
import type { ID, ListQuery, Paginated, Product, Warehouse, WarehouseInput } from "@/types";

export interface InventorySummary { totalProducts: number; totalUnits: number; lowStock: number; outOfStock: number; stockValue: number }
type BackendPage<T> = { content: T[]; page: number; size: number; totalElements: number };
type WarehouseDTO = { warehouseId: string; name: string; location?: string; contactPerson?: string; phone?: string; isActive: boolean };
const path = (resource: string) => `/bizuno/business/${encodeURIComponent(getStoredBusinessCode())}/${resource}`;
const ensureCode = () => { if (!getStoredBusinessCode()) throw new Error("Business session is missing. Please sign in again."); };
const mapWarehouse = (item: WarehouseDTO): Warehouse => ({ id: item.warehouseId, name: item.name, location: item.location ?? "", contactPerson: item.contactPerson, phone: item.phone, status: item.isActive ? "active" : "inactive" });
const query = (input: ListQuery = {}) => new URLSearchParams({ page: String(Math.max(0, (input.page ?? 1) - 1)), size: String(input.pageSize ?? 100), sortBy: input.sortBy ?? "name", sortDirection: input.sortDir === "desc" ? "desc" : "ASC" });
export function stockStatusOfProduct(p: Pick<Product, "stock" | "minStock">) { if (p.stock <= 0) return "out_of_stock"; if (p.stock <= p.minStock) return "low_stock"; return "in_stock"; }
export const stockStatusOf = stockStatusOfProduct;
export async function getInventorySummary(): Promise<InventorySummary> { return { totalProducts: 0, totalUnits: 0, lowStock: 0, outOfStock: 0, stockValue: 0 }; }
export async function listInventory(_query: ListQuery = {}): Promise<Paginated<Product>> { return { rows: [], total: 0, page: 1, pageSize: 10 }; }
export async function listWarehouses(): Promise<Warehouse[]> { ensureCode(); const result = await request<BackendPage<WarehouseDTO>>(`${path("warehouse")}?${query()}`); return result.content.map(mapWarehouse); }
export async function createWarehouse(input: WarehouseInput): Promise<Warehouse> { ensureCode(); return mapWarehouse(await request<WarehouseDTO>(path("warehouse"), { method: "POST", body: JSON.stringify({ name: input.name, location: input.location || undefined, contactPerson: input.contactPerson || undefined, phone: input.phone || undefined }) })); }
export async function updateWarehouse(id: ID, input: Partial<WarehouseInput>): Promise<Warehouse> { ensureCode(); return mapWarehouse(await request<WarehouseDTO>(`${path("warehouse")}/${id}`, { method: "PUT", body: JSON.stringify({ name: input.name, location: input.location || undefined, contactPerson: input.contactPerson || undefined, phone: input.phone || undefined, status: input.status === "active" }) })); }
export async function deleteWarehouse(id: ID): Promise<void> { ensureCode(); await request<unknown>(`${path("warehouse")}/${id}`, { method: "DELETE" }); }
export async function listStockMovements(_productId?: ID) { return []; }
export interface TransferInput { productId: ID; fromWarehouseId: ID; toWarehouseId: ID; quantity: number; note?: string }
export async function transferStock(_input: TransferInput): Promise<void> { throw new Error("Stock transfers are not available from the warehouse API yet."); }

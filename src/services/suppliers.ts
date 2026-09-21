import { nextId, purchaseOrders, suppliers } from "@/services/apis/db";
import { matches, paginate, request, sortRows } from "@/services/apis/client";
import type { ID, ListQuery, Paginated, PurchaseOrder, Supplier } from "@/types";

export function listSuppliers(query: ListQuery = {}): Promise<Paginated<Supplier>> {
  return request(() => paginate(sortRows(suppliers.filter((supplier) => matches([supplier.name, supplier.contactPerson, supplier.email, supplier.city], query.search)), query.sortBy ?? "name", query.sortDir ?? "asc"), query));
}

export function createSupplier(input: Omit<Supplier, "id" | "createdAt" | "outstanding">): Promise<Supplier> {
  return request(() => {
    const supplier: Supplier = { ...input, id: nextId("sup"), outstanding: 0, createdAt: new Date().toISOString() };
    suppliers.unshift(supplier);
    return supplier;
  });
}

export function updateSupplier(id: ID, input: Partial<Omit<Supplier, "id" | "createdAt" | "outstanding">>): Promise<Supplier> {
  return request(() => {
    const supplier = suppliers.find((item) => item.id === id);
    if (!supplier) throw new Error("Supplier not found");
    Object.assign(supplier, input);
    return supplier;
  });
}

export function listPurchaseOrders(query: ListQuery = {}): Promise<Paginated<PurchaseOrder>> {
  return request(() => paginate(sortRows(purchaseOrders.filter((order) => matches([order.number, order.supplierName, order.status], query.search)), query.sortBy ?? "issuedAt", query.sortDir ?? "desc"), query));
}

export function getSupplier(id: ID): Promise<Supplier | undefined> {
  return request(() => suppliers.find((supplier) => supplier.id === id));
}

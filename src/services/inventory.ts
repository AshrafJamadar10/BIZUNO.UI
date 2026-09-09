import { products, stockMovements, warehouses } from "@/services/apis/db";
import { matches, paginate, request, sortRows } from "@/services/apis/client";
import type { ID, ListQuery, Paginated, Product, StockStatus, Warehouse } from "@/types";

export function stockStatusOf(p: Pick<Product, "stock" | "minStock">): StockStatus {
  if (p.stock <= 0) return "out_of_stock";
  if (p.stock <= p.minStock) return "low_stock";
  return "in_stock";
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
}

export function getInventorySummary(): Promise<InventorySummary> {
  return request(() => ({
    totalProducts: products.length,
    totalUnits: products.reduce((s, p) => s + p.stock, 0),
    lowStock: products.filter((p) => stockStatusOf(p) === "low_stock").length,
    outOfStock: products.filter((p) => stockStatusOf(p) === "out_of_stock").length,
    stockValue: products.reduce((s, p) => s + p.stock * p.purchasePrice, 0),
  }));
}

export function listInventory(query: ListQuery = {}): Promise<Paginated<Product>> {
  return request(() => {
    let rows = products.filter((p) => matches([p.name, p.sku, p.categoryName], query.search));
    if (query.warehouseId && query.warehouseId !== "all")
      rows = rows.filter((p) => p.warehouseId === query.warehouseId);
    if (query.status && query.status !== "all")
      rows = rows.filter((p) => stockStatusOf(p) === query.status);
    rows = sortRows(rows, query.sortBy ?? "name", query.sortDir ?? "asc");
    return paginate(rows, { ...query, pageSize: query.pageSize ?? 10 });
  });
}

export function listWarehouses(): Promise<Warehouse[]> {
  return request(() => warehouses);
}

export function listStockMovements(productId?: ID) {
  return request(() =>
    productId ? stockMovements.filter((m) => m.productId === productId) : stockMovements,
  );
}

export interface TransferInput {
  productId: ID;
  fromWarehouseId: ID;
  toWarehouseId: ID;
  quantity: number;
  note?: string;
}

export function transferStock(input: TransferInput): Promise<void> {
  return request(() => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) throw new Error("Product not found");
    if (input.quantity > product.stock) throw new Error("Not enough stock at the source warehouse");
    product.warehouseId = input.toWarehouseId;
    stockMovements.unshift(
      {
        id: `mov-${Date.now()}-out`,
        productId: product.id,
        productName: product.name,
        warehouseId: input.fromWarehouseId,
        warehouseName: warehouses.find((w) => w.id === input.fromWarehouseId)?.name ?? "",
        type: "transfer_out",
        quantity: -input.quantity,
        reference: "Stock transfer",
        createdAt: new Date().toISOString(),
      },
      {
        id: `mov-${Date.now()}-in`,
        productId: product.id,
        productName: product.name,
        warehouseId: input.toWarehouseId,
        warehouseName: warehouses.find((w) => w.id === input.toWarehouseId)?.name ?? "",
        type: "transfer_in",
        quantity: input.quantity,
        reference: "Stock transfer",
        createdAt: new Date().toISOString(),
      },
    );
  });
}

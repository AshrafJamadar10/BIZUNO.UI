import { categories, invoices, nextId, products } from "@/services/apis/db";
import { matches, paginate, request, sortRows } from "@/services/apis/client";
import type { Category, ID, ListQuery, Paginated, Product, ProductInput } from "@/types";

export function listProducts(query: ListQuery = {}): Promise<Paginated<Product>> {
  return request(() => {
    let rows = products.filter((p) =>
      matches([p.name, p.sku, p.barcode, p.categoryName], query.search),
    );
    if (query.category && query.category !== "all")
      rows = rows.filter((p) => p.categoryId === query.category);
    if (query.status && query.status !== "all") rows = rows.filter((p) => p.status === query.status);
    rows = sortRows(rows, query.sortBy ?? "name", query.sortDir ?? "asc");
    return paginate(rows, query);
  });
}

export function getProduct(id: ID): Promise<Product | undefined> {
  return request(() => products.find((p) => p.id === id));
}

export function getProductSales(id: ID) {
  return request(() =>
    invoices
      .filter((inv) => inv.items.some((i) => i.productId === id))
      .map((inv) => ({
        invoiceNumber: inv.number,
        customerName: inv.customerName,
        issuedAt: inv.issuedAt,
        quantity: inv.items.filter((i) => i.productId === id).reduce((s, i) => s + i.quantity, 0),
        amount: inv.items.filter((i) => i.productId === id).reduce((s, i) => s + i.total, 0),
      })),
  );
}

export function listCategories(): Promise<Category[]> {
  return request(() => categories);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return request(() => {
    const product: Product = {
      ...input,
      id: nextId("prd"),
      categoryName: categories.find((c) => c.id === input.categoryId)?.name ?? "Uncategorised",
      createdAt: new Date().toISOString(),
    };
    products.unshift(product);
    return product;
  });
}

export function updateProduct(id: ID, input: Partial<ProductInput>): Promise<Product> {
  return request(() => {
    const existing = products.find((p) => p.id === id);
    if (!existing) throw new Error("Product not found");
    Object.assign(existing, input);
    if (input.categoryId) {
      existing.categoryName =
        categories.find((c) => c.id === input.categoryId)?.name ?? existing.categoryName;
    }
    return existing;
  });
}

export function deleteProduct(id: ID): Promise<void> {
  return request(() => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) products.splice(idx, 1);
  });
}

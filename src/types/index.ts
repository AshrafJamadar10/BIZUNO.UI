/** Domain model for the BizNexus business workspace. */

export type ID = string;

export type EntityStatus = "active" | "inactive";

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  status?: string;
  category?: string;
  warehouseId?: ID;
}

/* ------------------------------- Customers ------------------------------- */

export interface Customer {
  id: ID;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string | undefined;
  city: string;
  state: string;
  address: string;
  totalPurchases: number;
  outstanding: number;
  lastPurchaseAt: string | null;
  status: EntityStatus;
  createdAt: string;
}

export type CustomerInput = Omit<
  Customer,
  "id" | "totalPurchases" | "outstanding" | "lastPurchaseAt" | "createdAt"
>;

/* -------------------------------- Products -------------------------------- */

export interface Category {
  id: ID;
  name: string;
  parentId: ID | null;
  productCount: number;
  status: EntityStatus;
}

export interface Product {
  id: ID;
  name: string;
  sku: string;
  barcode: string;
  categoryId: ID;
  categoryName: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  minStock: number;
  warehouseId: ID;
  status: EntityStatus;
  description?: string | undefined;
  createdAt: string;
}

export type ProductInput = Omit<Product, "id" | "categoryName" | "createdAt">;

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Warehouse {
  id: ID;
  name: string;
  location: string;
  manager: string;
  phone: string;
  status: EntityStatus;
}

export interface StockMovement {
  id: ID;
  productId: ID;
  productName: string;
  warehouseId: ID;
  warehouseName: string;
  type: "purchase" | "sale" | "transfer_in" | "transfer_out" | "adjustment" | "return";
  quantity: number;
  reference: string;
  createdAt: string;
}

/* ---------------------------------- Sales ---------------------------------- */

export type PaymentStatus = "paid" | "partial" | "pending" | "overdue" | "cancelled";
export type OrderStatus = "draft" | "confirmed" | "processing" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "bank" | "card" | "upi" | "cheque" | "other";

export interface LineItem {
  productId: ID;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: ID;
  number: string;
  customerId: ID;
  customerName: string;
  issuedAt: string;
  dueAt: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  salesperson: string;
  notes?: string | undefined;
}

export interface Payment {
  id: ID;
  reference: string;
  partyType: "customer" | "supplier";
  partyId: ID;
  partyName: string;
  invoiceNumber: string;
  amount: number;
  method: PaymentMethod;
  receivedAt: string;
  status: "completed" | "pending" | "failed";
  note?: string | undefined;
}

/* -------------------------------- Dashboard -------------------------------- */

export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  change: number;
  kind: "currency" | "number";
}

export interface SeriesPoint {
  label: string;
  sales: number;
  purchases: number;
  expenses: number;
  revenue: number;
}

export interface ActivityEntry {
  id: ID;
  user: string;
  action: string;
  module: string;
  description: string;
  createdAt: string;
}

export interface AppNotification {
  id: ID;
  title: string;
  body: string;
  category: "inventory" | "billing" | "sales" | "people" | "system";
  read: boolean;
  createdAt: string;
}

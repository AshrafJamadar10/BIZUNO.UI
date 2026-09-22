/**
 * In-memory mock database.
 *
 * This is the ONLY place static data lives. Every module talks to the
 * service layer (src/services/*), never to this file directly, so swapping
 * in a REST client means rewriting the services and nothing else.
 */

import type {
  ActivityEntry,
  AppNotification,
  Category,
  Customer,
  Invoice,
  LineItem,
  Payment,
  Product,
  StockMovement,
  Supplier,
  PurchaseOrder,
  Warehouse,
} from "@/types";

let seq = 1000;
export const nextId = (prefix: string) => `${prefix}-${++seq}`;

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const warehouses: Warehouse[] = [
  {
    id: "wh-1",
    name: "Andheri Main Warehouse",
    location: "Andheri East, Mumbai, MH",
    status: "active",
  },
  {
    id: "wh-2",
    name: "Whitefield Hub",
    location: "Whitefield, Bengaluru, KA",
    status: "active",
  },
  {
    id: "wh-3",
    name: "Okhla Distribution Centre",
    location: "Okhla Phase II, New Delhi, DL",
    status: "active",
  },
];

export const categories: Category[] = [
  { id: "cat-1", name: "Laptops", productCount: 4, status: "active" },
  { id: "cat-2", name: "Smartphones", productCount: 3, status: "active" },
  { id: "cat-3", name: "Accessories", productCount: 4, status: "active" },
  { id: "cat-4", name: "Office Furniture", productCount: 2, status: "active" },
  { id: "cat-5", name: "Networking", productCount: 2, status: "active" },
];

type Seed = Omit<Product, "id" | "categoryName" | "createdAt">;

const productSeed: Seed[] = [
  {
    name: "MacBook Air M3 13\"",
    sku: "LAP-MBA-M3-13",
    barcode: "8901234500011",
    categoryId: "cat-1",
    unit: "pcs",
    purchasePrice: 92000,
    sellingPrice: 114900,
    taxRate: 18,
    stock: 24,
    minStock: 8,
    warehouseId: "wh-1",
    status: "active",
    description: "8-core CPU, 16GB unified memory, 512GB SSD. Midnight finish.",
  },
  {
    name: "Dell Latitude 7450",
    sku: "LAP-DEL-7450",
    barcode: "8901234500028",
    categoryId: "cat-1",
    unit: "pcs",
    purchasePrice: 108000,
    sellingPrice: 132500,
    taxRate: 18,
    stock: 11,
    minStock: 6,
    warehouseId: "wh-1",
    status: "active",
    description: "Intel Core Ultra 7, 16GB RAM, 1TB NVMe, business warranty.",
  },
  {
    name: "HP ProBook 450 G11",
    sku: "LAP-HP-450G11",
    barcode: "8901234500035",
    categoryId: "cat-1",
    unit: "pcs",
    purchasePrice: 61500,
    sellingPrice: 74900,
    taxRate: 18,
    stock: 4,
    minStock: 10,
    warehouseId: "wh-2",
    status: "active",
  },
  {
    name: "Lenovo ThinkPad E16",
    sku: "LAP-LEN-E16",
    barcode: "8901234500042",
    categoryId: "cat-1",
    unit: "pcs",
    purchasePrice: 68000,
    sellingPrice: 82400,
    taxRate: 18,
    stock: 0,
    minStock: 5,
    warehouseId: "wh-3",
    status: "active",
  },
  {
    name: "Samsung Galaxy S25",
    sku: "MOB-SAM-S25",
    barcode: "8901234500059",
    categoryId: "cat-2",
    unit: "pcs",
    purchasePrice: 68500,
    sellingPrice: 82999,
    taxRate: 18,
    stock: 37,
    minStock: 12,
    warehouseId: "wh-1",
    status: "active",
  },
  {
    name: "iPhone 16 128GB",
    sku: "MOB-APL-16-128",
    barcode: "8901234500066",
    categoryId: "cat-2",
    unit: "pcs",
    purchasePrice: 71000,
    sellingPrice: 79900,
    taxRate: 18,
    stock: 18,
    minStock: 10,
    warehouseId: "wh-2",
    status: "active",
  },
  {
    name: "Redmi Note 14 Pro",
    sku: "MOB-XIA-N14P",
    barcode: "8901234500073",
    categoryId: "cat-2",
    unit: "pcs",
    purchasePrice: 19800,
    sellingPrice: 24999,
    taxRate: 18,
    stock: 62,
    minStock: 20,
    warehouseId: "wh-3",
    status: "active",
  },
  {
    name: "Logitech MX Keys S Wireless Keyboard",
    sku: "ACC-LOG-MXKS",
    barcode: "8901234500080",
    categoryId: "cat-3",
    unit: "pcs",
    purchasePrice: 8200,
    sellingPrice: 11495,
    taxRate: 18,
    stock: 46,
    minStock: 15,
    warehouseId: "wh-1",
    status: "active",
  },
  {
    name: "Logitech MX Master 3S Mouse",
    sku: "ACC-LOG-MXM3S",
    barcode: "8901234500097",
    categoryId: "cat-3",
    unit: "pcs",
    purchasePrice: 7100,
    sellingPrice: 9995,
    taxRate: 18,
    stock: 9,
    minStock: 12,
    warehouseId: "wh-2",
    status: "active",
  },
  {
    name: "Anker 65W GaN Charger",
    sku: "ACC-ANK-65W",
    barcode: "8901234500103",
    categoryId: "cat-3",
    unit: "pcs",
    purchasePrice: 2450,
    sellingPrice: 3799,
    taxRate: 18,
    stock: 120,
    minStock: 30,
    warehouseId: "wh-1",
    status: "active",
  },
  {
    name: "Dell 27\" UltraSharp Monitor",
    sku: "ACC-DEL-U2724",
    barcode: "8901234500110",
    categoryId: "cat-3",
    unit: "pcs",
    purchasePrice: 31200,
    sellingPrice: 39900,
    taxRate: 18,
    stock: 15,
    minStock: 6,
    warehouseId: "wh-3",
    status: "active",
  },
  {
    name: "Featherlite Ergo Office Chair",
    sku: "FUR-FLT-ERGO",
    barcode: "8901234500127",
    categoryId: "cat-4",
    unit: "pcs",
    purchasePrice: 12400,
    sellingPrice: 17250,
    taxRate: 18,
    stock: 28,
    minStock: 10,
    warehouseId: "wh-1",
    status: "active",
  },
  {
    name: "Godrej Executive Desk 5ft",
    sku: "FUR-GDJ-DESK5",
    barcode: "8901234500134",
    categoryId: "cat-4",
    unit: "pcs",
    purchasePrice: 18900,
    sellingPrice: 25400,
    taxRate: 18,
    stock: 6,
    minStock: 4,
    warehouseId: "wh-3",
    status: "active",
  },
  {
    name: "TP-Link Omada AX3000 Access Point",
    sku: "NET-TPL-AX3000",
    barcode: "8901234500141",
    categoryId: "cat-5",
    unit: "pcs",
    purchasePrice: 8900,
    sellingPrice: 12400,
    taxRate: 18,
    stock: 33,
    minStock: 12,
    warehouseId: "wh-2",
    status: "active",
  },
  {
    name: "Cisco CBS250 24-Port Switch",
    sku: "NET-CIS-CBS250",
    barcode: "8901234500158",
    categoryId: "cat-5",
    unit: "pcs",
    purchasePrice: 26500,
    sellingPrice: 34800,
    taxRate: 18,
    stock: 3,
    minStock: 5,
    warehouseId: "wh-1",
    status: "active",
  },
];

export const products: Product[] = productSeed.map((p, i) => ({
  ...p,
  id: `prd-${i + 1}`,
  categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? "Uncategorised",
  createdAt: daysAgo(120 - i * 3),
}));

const customerSeed: Array<Omit<Customer, "id" | "createdAt">> = [
  {
    name: "ABC Enterprises",
    contactPerson: "Rohit Malhotra",
    phone: "+91 98330 21458",
    email: "accounts@abcenterprises.in",
    gstin: "27AABCA1234K1ZP",
    city: "Mumbai",
    state: "Maharashtra",
    address: "402, Prabhat Chambers, Marol, Andheri East, Mumbai 400059",
    totalPurchases: 2845000,
    outstanding: 184500,
    lastPurchaseAt: daysAgo(3),
    status: "active",
  },
  {
    name: "Global Tech Solutions Pvt Ltd",
    contactPerson: "Anita Deshpande",
    phone: "+91 99450 77102",
    email: "purchase@globaltechsol.com",
    gstin: "29AAGCG9821M1Z4",
    city: "Bengaluru",
    state: "Karnataka",
    address: "7th Floor, Prestige Atrium, Whitefield, Bengaluru 560066",
    totalPurchases: 5120000,
    outstanding: 0,
    lastPurchaseAt: daysAgo(8),
    status: "active",
  },
  {
    name: "Sharma Traders",
    contactPerson: "Vikas Sharma",
    phone: "+91 94170 30022",
    email: "vikas@sharmatraders.co.in",
    gstin: "07AAFFS4410L1ZK",
    city: "New Delhi",
    state: "Delhi",
    address: "Shop 14, Nehru Place Market, New Delhi 110019",
    totalPurchases: 962000,
    outstanding: 96400,
    lastPurchaseAt: daysAgo(1),
    status: "active",
  },
  {
    name: "Modern Retail Pvt Ltd",
    contactPerson: "Sneha Iyer",
    phone: "+91 98410 55291",
    email: "sneha.iyer@modernretail.in",
    gstin: "33AACCM7712N1Z9",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "18 Anna Salai, Teynampet, Chennai 600018",
    totalPurchases: 1740500,
    outstanding: 312000,
    lastPurchaseAt: daysAgo(14),
    status: "active",
  },
  {
    name: "Kohli Office Systems",
    contactPerson: "Manav Kohli",
    phone: "+91 98150 66713",
    email: "manav@kohlioffice.in",
    gstin: "03AAECK3388P1ZR",
    city: "Chandigarh",
    state: "Punjab",
    address: "SCO 221, Sector 34A, Chandigarh 160022",
    totalPurchases: 488000,
    outstanding: 0,
    lastPurchaseAt: daysAgo(31),
    status: "active",
  },
  {
    name: "Vertex Infotech LLP",
    contactPerson: "Farhan Sheikh",
    phone: "+91 90040 18823",
    email: "ops@vertexinfotech.in",
    gstin: "24AAVFV1109Q1Z2",
    city: "Ahmedabad",
    state: "Gujarat",
    address: "B-1204, Titanium City Centre, Satellite, Ahmedabad 380015",
    totalPurchases: 1290000,
    outstanding: 74800,
    lastPurchaseAt: daysAgo(6),
    status: "active",
  },
  {
    name: "Sunrise Hospitality Group",
    contactPerson: "Priya Rane",
    phone: "+91 97690 44510",
    email: "priya@sunrisehg.com",
    gstin: "27AAKCS5567H1ZB",
    city: "Pune",
    state: "Maharashtra",
    address: "Sunrise House, Baner Road, Pune 411045",
    totalPurchases: 655000,
    outstanding: 0,
    lastPurchaseAt: daysAgo(45),
    status: "inactive",
  },
  {
    name: "Nova Digital Media",
    contactPerson: "Arjun Rathi",
    phone: "+91 88790 12234",
    email: "finance@novadigital.in",
    gstin: "36AAFCN2290J1Z8",
    city: "Hyderabad",
    state: "Telangana",
    address: "Plot 42, HITEC City, Madhapur, Hyderabad 500081",
    totalPurchases: 2130000,
    outstanding: 143200,
    lastPurchaseAt: daysAgo(2),
    status: "active",
  },
];

export const customers: Customer[] = customerSeed.map((c, i) => ({
  ...c,
  id: `cus-${i + 1}`,
  createdAt: daysAgo(300 - i * 20),
}));

const salespeople = ["Neha Kulkarni", "Amit Bansal", "Ritu Verma", "Karan Shetty"];

function lineItem(product: Product, qty: number, discountPercent: number): LineItem {
  const gross = product.sellingPrice * qty;
  const total = gross - (gross * discountPercent) / 100;
  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: qty,
    unitPrice: product.sellingPrice,
    discountPercent,
    taxRate: product.taxRate,
    total,
  };
}

export function totalsFor(items: LineItem[]) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = items.reduce(
    (s, i) => s + (i.unitPrice * i.quantity * i.discountPercent) / 100,
    0,
  );
  const tax = items.reduce((s, i) => s + (i.total * i.taxRate) / 100, 0);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

const invoiceSeed: Array<{
  customerIdx: number;
  items: Array<[number, number, number]>;
  issued: number;
  due: number;
  paidRatio: number;
  orderStatus: Invoice["orderStatus"];
}> = [
  { customerIdx: 0, items: [[0, 2, 5], [8, 3, 0]], issued: 3, due: 12, paidRatio: 0.4, orderStatus: "completed" },
  { customerIdx: 1, items: [[4, 6, 3], [9, 10, 0]], issued: 8, due: 7, paidRatio: 1, orderStatus: "completed" },
  { customerIdx: 2, items: [[6, 8, 2]], issued: 1, due: 15, paidRatio: 0, orderStatus: "processing" },
  { customerIdx: 3, items: [[1, 3, 4], [10, 4, 0]], issued: 26, due: -4, paidRatio: 0.25, orderStatus: "completed" },
  { customerIdx: 5, items: [[11, 12, 6]], issued: 6, due: 9, paidRatio: 0, orderStatus: "confirmed" },
  { customerIdx: 7, items: [[5, 4, 2], [7, 5, 0]], issued: 2, due: 18, paidRatio: 0.5, orderStatus: "processing" },
  { customerIdx: 4, items: [[13, 6, 0]], issued: 31, due: 1, paidRatio: 1, orderStatus: "completed" },
  { customerIdx: 1, items: [[2, 5, 5], [14, 2, 0]], issued: 12, due: 3, paidRatio: 1, orderStatus: "completed" },
  { customerIdx: 0, items: [[12, 3, 0]], issued: 18, due: -2, paidRatio: 0, orderStatus: "completed" },
  { customerIdx: 6, items: [[3, 2, 0], [9, 8, 5]], issued: 45, due: 30, paidRatio: 1, orderStatus: "cancelled" },
  { customerIdx: 7, items: [[0, 1, 0]], issued: 0, due: 20, paidRatio: 0, orderStatus: "draft" },
  { customerIdx: 3, items: [[10, 6, 3], [8, 6, 0]], issued: 9, due: 6, paidRatio: 0.6, orderStatus: "completed" },
];

export const invoices: Invoice[] = invoiceSeed.map((seed, i) => {
  const items = seed.items.map(([p, q, d]) => lineItem(products[p]!, q, d));
  const t = totalsFor(items);
  const paid = Math.round(t.total * seed.paidRatio);
  const balance = Math.round(t.total) - paid;
  const overdue = new Date(daysAhead(seed.due)).getTime() < Date.now();
  const customer = customers[seed.customerIdx]!;
  const paymentStatus: Invoice["paymentStatus"] =
    seed.orderStatus === "cancelled"
      ? "cancelled"
      : balance <= 0
        ? "paid"
        : overdue
          ? "overdue"
          : paid > 0
            ? "partial"
            : "pending";

  return {
    id: `inv-${i + 1}`,
    number: `INV-2026-${String(124 + i).padStart(5, "0")}`,
    customerId: customer.id,
    customerName: customer.name,
    issuedAt: daysAgo(seed.issued),
    dueAt: daysAhead(seed.due),
    items,
    subtotal: Math.round(t.subtotal),
    discount: Math.round(t.discount),
    tax: Math.round(t.tax),
    total: Math.round(t.total),
    paid,
    balance,
    paymentStatus,
    orderStatus: seed.orderStatus,
    salesperson: salespeople[i % salespeople.length]!,
    notes: "Goods once sold will not be taken back. Subject to Mumbai jurisdiction.",
  };
});

export const payments: Payment[] = invoices
  .filter((inv) => inv.paid > 0)
  .map((inv, i) => ({
    id: `pay-${i + 1}`,
    reference: `PAY-2026-${String(3011 + i).padStart(5, "0")}`,
    partyType: "customer" as const,
    partyId: inv.customerId,
    partyName: inv.customerName,
    invoiceNumber: inv.number,
    amount: inv.paid,
    method: (["upi", "bank", "cash", "cheque", "card"] as const)[i % 5]!,
    receivedAt: daysAgo(i + 1),
    status: "completed" as const,
    note: "Received against invoice",
  }));

export const suppliers: Supplier[] = [
  { id: "sup-1", name: "TechSource Distributors", contactPerson: "Vikram Shah", phone: "+91 98201 33221", email: "orders@techsource.in", gstin: "27AABCT1234M1Z5", city: "Mumbai", outstanding: 485000, status: "active", createdAt: daysAgo(180) },
  { id: "sup-2", name: "OfficeWorks India", contactPerson: "Meera Nair", phone: "+91 98450 44110", email: "sales@officeworks.in", gstin: "29AAECO5678R1Z2", city: "Bengaluru", outstanding: 126000, status: "active", createdAt: daysAgo(120) },
  { id: "sup-3", name: "Network Hub Pvt Ltd", contactPerson: "Sanjay Rao", phone: "+91 98190 22011", email: "accounts@networkhub.in", city: "Pune", outstanding: 0, status: "active", createdAt: daysAgo(90) },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "po-1", number: "PO-2026-0041", supplierId: "sup-1", supplierName: "TechSource Distributors", issuedAt: daysAgo(4), expectedAt: daysAhead(5), total: 642000, status: "ordered" },
  { id: "po-2", number: "PO-2026-0040", supplierId: "sup-2", supplierName: "OfficeWorks India", issuedAt: daysAgo(12), expectedAt: daysAgo(2), total: 284000, status: "received" },
];

export const stockMovements: StockMovement[] = products.slice(0, 10).map((p, i) => ({
  id: `mov-${i + 1}`,
  productId: p.id,
  productName: p.name,
  warehouseId: p.warehouseId,
  warehouseName: warehouses.find((w) => w.id === p.warehouseId)?.name ?? "",
  type: (["sale", "purchase", "transfer_in", "adjustment", "return"] as const)[i % 5]!,
  quantity: [4, 20, 10, -3, 2][i % 5]!,
  reference: i % 5 === 1 ? `PO-2026-0${40 + i}` : `INV-2026-00${124 + i}`,
  createdAt: daysAgo(i),
}));

export const activities: ActivityEntry[] = [
  {
    id: "act-1",
    user: "Neha Kulkarni",
    action: "created invoice",
    module: "Invoices",
    description: "Created invoice INV-2026-00135 for Nova Digital Media",
    createdAt: new Date(Date.now() - 26 * 60000).toISOString(),
  },
  {
    id: "act-2",
    user: "Amit Bansal",
    action: "updated product",
    module: "Products",
    description: "Updated selling price for Dell Latitude 7450",
    createdAt: new Date(Date.now() - 92 * 60000).toISOString(),
  },
  {
    id: "act-3",
    user: "Ritu Verma",
    action: "recorded payment",
    module: "Payments",
    description: "Recorded UPI payment of ₹2,45,000 from ABC Enterprises",
    createdAt: new Date(Date.now() - 190 * 60000).toISOString(),
  },
  {
    id: "act-4",
    user: "Rakesh Menon",
    action: "transferred stock",
    module: "Inventory",
    description: "Moved 50 units of Anker 65W GaN Charger to Whitefield Hub",
    createdAt: daysAgo(1),
  },
  {
    id: "act-5",
    user: "Karan Shetty",
    action: "added customer",
    module: "Customers",
    description: "Added Vertex Infotech LLP to the customer directory",
    createdAt: daysAgo(1),
  },
];

export const notifications: AppNotification[] = [
  {
    id: "ntf-1",
    title: "Cisco CBS250 24-Port Switch is low on stock",
    body: "Only 3 units left at Andheri Main Warehouse (minimum 5).",
    category: "inventory",
    read: false,
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: "ntf-2",
    title: "Invoice INV-2026-00127 is overdue",
    body: "Modern Retail Pvt Ltd has a balance of ₹3,12,000 past the due date.",
    category: "billing",
    read: false,
    createdAt: new Date(Date.now() - 130 * 60000).toISOString(),
  },
  {
    id: "ntf-3",
    title: "Payment received",
    body: "Global Tech Solutions cleared INV-2026-00125 in full.",
    category: "sales",
    read: false,
    createdAt: daysAgo(1),
  },
  {
    id: "ntf-4",
    title: "Lenovo ThinkPad E16 is out of stock",
    body: "Okhla Distribution Centre shows zero available units.",
    category: "inventory",
    read: true,
    createdAt: daysAgo(2),
  },
  {
    id: "ntf-5",
    title: "New employee added",
    body: "Divya Nair joined as Warehouse Manager, Bengaluru.",
    category: "people",
    read: true,
    createdAt: daysAgo(4),
  },
];

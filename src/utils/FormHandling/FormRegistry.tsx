import type { FieldConfig } from "./FormEngine";

export interface FormRegistryEntry {
  formKey: string;
  label: string;
  description: string;
  icon: string;
  order: number;
  defaultFields: FieldConfig[];
}

export const FORM_REGISTRY: FormRegistryEntry[] = [
  {
    formKey: "customer",
    label: "Customer",
    description: "Customer master form used in the Customers tab.",
    icon: "customers",
    order: 1,
    defaultFields: [],
  },
  {
    formKey: "product",
    label: "Product",
    description: "Product catalogue form used in the Products tab.",
    icon: "products",
    order: 2,
    defaultFields: [],
  },
  {
    formKey: "category",
    label: "Product Category",
    description: "Category form used in the Categories tab.",
    icon: "categories",
    order: 3,
    defaultFields: [],
  },
  {
    formKey: "supplier",
    label: "Supplier",
    description: "Supplier form used in the Suppliers tab.",
    icon: "suppliers",
    order: 4,
    defaultFields: [],
  },
  {
    formKey: "warehouse",
    label: "Warehouse",
    description: "Warehouse form used in the Warehouses tab.",
    icon: "warehouses",
    order: 5,
    defaultFields: [],
  },
  {
    formKey: "invoice",
    label: "Invoice / Sale",
    description: "Sales invoice form used in the Sales tab.",
    icon: "sales",
    order: 6,
    defaultFields: [],
  },
  {
    formKey: "payment",
    label: "Payment",
    description: "Payment recording form used in the Payments tab.",
    icon: "payments",
    order: 7,
    defaultFields: [],
  },
  {
    formKey: "purchase",
    label: "Purchase Order",
    description: "Purchase order form used in the Purchases tab.",
    icon: "purchases",
    order: 8,
    defaultFields: [],
  },
  {
    formKey: "user",
    label: "User",
    description: "Workspace user form used in the Users tab.",
    icon: "users",
    order: 9,
    defaultFields: [],
  },
  {
    formKey: "staff",
    label: "Staff",
    description: "Staff member form used in the Staff tab.",
    icon: "staff",
    order: 10,
    defaultFields: [],
  },
  {
    formKey: "platform_tenant",
    label: "Platform Tenant",
    description: "Business tenant form used in the Platform tab.",
    icon: "platform",
    order: 11,
    defaultFields: [],
  },
  {
    formKey: "platform_package",
    label: "Subscription Package",
    description: "Package form used in Platform Packages.",
    icon: "packages",
    order: 12,
    defaultFields: [],
  },
  {
    formKey: "website",
    label: "Website Contact Form",
    description: "Public website form for visitors.",
    icon: "website",
    order: 13,
    defaultFields: [],
  },
];

export const FORM_REGISTRY_MAP: Record<string, FormRegistryEntry> =
  FORM_REGISTRY.reduce((acc, entry) => {
    acc[entry.formKey] = entry;
    return acc;
  }, {} as Record<string, FormRegistryEntry>);

export function getFormEntry(formKey: string): FormRegistryEntry | undefined {
  return FORM_REGISTRY_MAP[formKey];
}
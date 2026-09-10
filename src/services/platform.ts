import { request } from "@/services/apis/client";

export interface Tenant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  plan: string;
  status: "active" | "trial" | "suspended";
  users: number;
  createdAt: string;
  renewsAt: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  userLimit: number;
  features: string[];
  activeTenants: number;
  status: "active" | "archived";
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  businessName: string;
  packageName: string;
  subscribedAt: string;
  paidAmount: number;
  billingCycle: "monthly" | "annual";
  expiresAt: string;
  status: "active" | "expiring" | "expired";
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const tenants: Tenant[] = [
  { id: "tenant-1", businessName: "Nexus Traders Pvt Ltd", ownerName: "Ashraf Jamadar", email: "ashraf@nexustraders.in", plan: "Growth", status: "active", users: 18, createdAt: daysAgo(210), renewsAt: daysAhead(32) },
  { id: "tenant-2", businessName: "Global Tech Solutions", ownerName: "Anita Deshpande", email: "anita@globaltechsol.com", plan: "Enterprise", status: "active", users: 42, createdAt: daysAgo(155), renewsAt: daysAhead(14) },
  { id: "tenant-3", businessName: "Kohli Office Systems", ownerName: "Manav Kohli", email: "manav@kohlioffice.in", plan: "Starter", status: "trial", users: 4, createdAt: daysAgo(5), renewsAt: daysAhead(9) },
];

export const packages: SubscriptionPackage[] = [
  { id: "pkg-starter", name: "Starter", monthlyPrice: 999, annualPrice: 9990, userLimit: 5, features: ["Customers", "Products", "Sales & invoices"], activeTenants: 12, status: "active" },
  { id: "pkg-growth", name: "Growth", monthlyPrice: 2499, annualPrice: 24990, userLimit: 25, features: ["Everything in Starter", "Inventory", "Reports", "Payments"], activeTenants: 28, status: "active" },
  { id: "pkg-enterprise", name: "Enterprise", monthlyPrice: 6999, annualPrice: 69990, userLimit: 100, features: ["Everything in Growth", "Multiple warehouses", "Priority support", "Advanced controls"], activeTenants: 8, status: "active" },
];

export const subscriptions: TenantSubscription[] = [
  { id: "sub-1", tenantId: "tenant-1", businessName: "Nexus Traders Pvt Ltd", packageName: "Growth", subscribedAt: daysAgo(210), paidAmount: 24990, billingCycle: "annual", expiresAt: daysAhead(32), status: "active" },
  { id: "sub-2", tenantId: "tenant-2", businessName: "Global Tech Solutions", packageName: "Enterprise", subscribedAt: daysAgo(155), paidAmount: 6999, billingCycle: "monthly", expiresAt: daysAhead(14), status: "expiring" },
  { id: "sub-3", tenantId: "tenant-3", businessName: "Kohli Office Systems", packageName: "Starter", subscribedAt: daysAgo(5), paidAmount: 0, billingCycle: "monthly", expiresAt: daysAhead(9), status: "active" },
];

export function listTenants(): Promise<Tenant[]> { return request(() => tenants); }
export function listPackages(): Promise<SubscriptionPackage[]> { return request(() => packages); }
export function listSubscriptions(): Promise<TenantSubscription[]> { return request(() => subscriptions); }
export function createTenant(input: Pick<Tenant, "businessName" | "ownerName" | "email" | "plan">): Promise<Tenant> {
  return request(() => {
    const tenant: Tenant = { ...input, id: `tenant-${Date.now()}`, status: "trial", users: 1, createdAt: new Date().toISOString(), renewsAt: daysAhead(14) };
    tenants.unshift(tenant);
    return tenant;
  });
}

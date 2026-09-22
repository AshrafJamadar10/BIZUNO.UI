import { request, requestWithMeta } from "@/services/apis/client";

export interface Tenant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  logo?: string | null;
  plan: string;
  status: "active" | "trial" | "suspended";
  users: number;
  createdAt: string;
  renewsAt: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  billingPeriod: "MONTHLY" | "QUARTERLY" | "YEARLY" | "LIFETIME" | "ONE_TIME";
  packageDays: number;
  trialDays: number;
  setupFee: number;
  recommended: boolean;
  features: PackageFeature[];
  activeTenants: number;
  status: "active" | "archived";
}

export type PackageScope = "BUSINESS" | "DASHBOARD" | "PACKAGE" | "ROLE" | "USER" | "SETTINGS" | "AUDIT_LOGS" | "SUBSCRIPTION";
export type PackageOperation = "CREATE" | "READ" | "UPDATE" | "DELETE";
export type FeatureLimitType = "NONE" | "COUNT" | "AMOUNT" | "STORAGE";
export interface PackageFeature {
  featureCode: string;
  featureName: string;
  description: string;
  scope: PackageScope;
  operations: PackageOperation[];
  limitType: FeatureLimitType;
  limitValue: number;
  unit: string;
  isEnabled: boolean;
  displayOrder: number;
}

export type PackageInput = Pick<SubscriptionPackage, "name" | "description" | "basePrice" | "billingPeriod" | "packageDays" | "trialDays" | "setupFee" | "recommended"> & {
  features: PackageFeature[];
};

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

const asArray = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "object" && payload && "content" in payload && Array.isArray((payload as { content?: T[] }).content)) return (payload as { content: T[] }).content;
  if (typeof payload === "object" && payload && "rows" in payload && Array.isArray((payload as { rows?: T[] }).rows)) return (payload as { rows: T[] }).rows;
  if (typeof payload === "object" && payload && "data" in payload && Array.isArray((payload as { data?: T[] }).data)) return (payload as { data: T[] }).data;
  return [];
};

const normalizeOwnerName = (firstName?: string, lastName?: string): string => [`${firstName ?? ""}`.trim(), `${lastName ?? ""}`.trim()].filter(Boolean).join(" ") || "Business owner";

const toIsoDate = (value?: string | number | Date | null): string => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const mapTenant = (row: any): Tenant => {
  const [firstName, ...rest] = (row.firstName ?? row.ownerName ?? "").toString().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");
  return {
    id: String(row.businessId ?? row.id ?? crypto.randomUUID()),
    businessName: row.businessName ?? "Business",
    ownerName: normalizeOwnerName(row.firstName ?? firstName, row.lastName ?? lastName),
    email: row.email ?? "",
    logo: row.logo ?? null,
    plan: row.plan ?? "Starter",
    status: row.active === false ? "suspended" : row.status ?? "active",
    users: Number(row.users ?? 1),
    createdAt: toIsoDate(row.createdDate ?? row.createdAt),
    renewsAt: toIsoDate(row.renewsAt ?? row.createdDate ?? row.createdAt),
  };
};

const mapPackage = (row: any): SubscriptionPackage => {
  const features = Array.isArray(row.features) ? row.features.map((feature: any): PackageFeature => ({
    featureCode: feature.packageFeatureCode ?? feature.featureCode ?? "",
    featureName: feature.featureName ?? feature.scope ?? "Included feature",
    description: feature.description ?? "",
    scope: feature.scope ?? "DASHBOARD",
    operations: Array.isArray(feature.operations) ? feature.operations : [],
    limitType: feature.limitType ?? "NONE",
    limitValue: Number(feature.limitValue ?? 0),
    unit: feature.unit ?? "",
    isEnabled: feature.isEnabled !== false,
    displayOrder: Number(feature.displayOrder ?? 0),
  })) : [];
  return {
    id: String(row.packageId ?? row.id ?? crypto.randomUUID()),
    name: row.name ?? "Package",
    description: row.description ?? "",
    basePrice: Number(row.basePrice ?? row.monthlyPrice ?? 0),
    billingPeriod: row.billingPeriod ?? "MONTHLY",
    packageDays: Number(row.packageDays ?? 30),
    trialDays: Number(row.trialDays ?? 0),
    setupFee: Number(row.setupFee ?? 0),
    recommended: Boolean(row.recommended),
    features,
    activeTenants: Number(row.activeTenants ?? 0),
    status: row.status ?? "active",
  };
};

const mapSubscription = (row: any): TenantSubscription => ({
  id: String(row.subscriptionId ?? row.id ?? crypto.randomUUID()),
  tenantId: String(row.businessId ?? row.tenantId ?? ""),
  businessName: row.businessName ?? "Business",
  packageName: row.packageName ?? row.pack?.name ?? "Plan",
  subscribedAt: toIsoDate(row.startDate ?? row.subscribedAt),
  paidAmount: Number(row.amountPaid ?? row.paidAmount ?? 0),
  billingCycle: row.billingPeriod === "YEARLY" || row.billingCycle === "annual" ? "annual" : "monthly",
  expiresAt: toIsoDate(row.endDate ?? row.expiresAt),
  status: row.subscriptionStatus === "EXPIRED" ? "expired" : row.subscriptionStatus === "EXPIRING" ? "expiring" : "active",
});

export function listTenants(): Promise<Tenant[]> {
  return request<any>("/bizuno/business?page=0&size=100").then((payload) => asArray<any>(payload).map(mapTenant));
}

export function listPackages(): Promise<SubscriptionPackage[]> {
  return request<any>("/bizuno/packages?page=0&size=100").then((payload) => asArray<any>(payload).map(mapPackage));
}

export function listSubscriptions(): Promise<TenantSubscription[]> {
  return request<any>("/bizuno/subscriptions?page=0&size=100").then((payload) => asArray<any>(payload).map(mapSubscription));
}

export type TenantRegistrationInput = Pick<Tenant, "businessName" | "ownerName" | "email" | "plan"> & {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  logo?: File | null;
};

export function createTenant(input: TenantRegistrationInput): Promise<{ tenant: Tenant; message: string }> {
  const fullName = (input.ownerName ?? "Business Owner").trim();
  const firstNameSource = input.firstName ?? fullName.split(/\s+/).filter(Boolean)[0] ?? "Business";
  const [explicitFirstName, ...explicitRest] = firstNameSource.split(/\s+/).filter(Boolean);
  const fallbackLastName = explicitRest.join(" ") || "Owner";
  const lastName = (input.lastName ?? fallbackLastName).trim();
  const firstName = explicitFirstName || "Business";
  const phone = input.phone || "9999999999";
  const password = input.password || "Bizuno@123";

  const body = new FormData();
  body.append("businessName", input.businessName);
  body.append("firstName", firstName);
  body.append("lastName", lastName);
  body.append("email", input.email);
  body.append("phone", phone);
  body.append("password", password);
  if (input.logo) body.append("logo", input.logo);

  return requestWithMeta<any>("/bizuno/auth/register/business", {
    method: "POST",
    body,
  }).then((response) => ({
    tenant: mapTenant(response.data ?? {}),
    message: response.message,
  }));
}

export function updateTenant(id: string, input: Partial<Pick<Tenant, "businessName" | "ownerName" | "email" | "plan" | "status">> & { firstName?: string; lastName?: string; phone?: string; password?: string }): Promise<Tenant> {
  const fullName = (input.ownerName ?? "Business Owner").trim();
  const firstNameSource = input.firstName ?? fullName.split(/\s+/).filter(Boolean)[0] ?? "Business";
  const [explicitFirstName, ...explicitRest] = firstNameSource.split(/\s+/).filter(Boolean);
  const fallbackLastName = explicitRest.join(" ") || "Owner";
  const lastName = (input.lastName ?? fallbackLastName).trim();
  const firstName = explicitFirstName || "Business";
  const phone = input.phone || "9999999999";
  const password = input.password || "Bizuno@123";

  return request<any>(`/bizuno/business/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      businessName: input.businessName ?? "Business",
      firstName,
      lastName,
      email: input.email ?? "",
      phone,
      password,
      plan: input.plan ?? "Starter",
      active: input.status === "active" || input.status === "trial",
    }),
  }).then((payload) => mapTenant((payload && typeof payload === "object" && "data" in payload ? (payload as { data: any }).data : payload) ?? {}));
}

export function updatePackage(id: string, input: Partial<Omit<SubscriptionPackage, "id">>): Promise<SubscriptionPackage> {
  return request<any>(`/bizuno/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name ?? "Package",
      description: input.description ?? `${input.name ?? "Package"} plan`,
      basePrice: Number(input.basePrice ?? 0),
      billingPeriod: input.billingPeriod ?? "MONTHLY",
      packageDays: Number(input.packageDays ?? 30),
      trialDays: Number(input.trialDays ?? 14),
      setupFee: Number(input.setupFee ?? 0),
      displayOrder: 0,
      recommended: input.recommended ?? false,
      features: input.features ?? [],
    }),
  }).then((payload) => mapPackage((payload && typeof payload === "object" && "data" in payload ? (payload as { data: any }).data : payload) ?? {}));
}

const packageRequest = (input: PackageInput) => ({
  name: input.name.trim(),
  description: input.description.trim(),
  basePrice: Number(input.basePrice),
  billingPeriod: input.billingPeriod,
  packageDays: Number(input.packageDays),
  trialDays: Number(input.trialDays),
  setupFee: Number(input.setupFee),
  displayOrder: 0,
  recommended: input.recommended,
  features: input.features,
});

export function createPackage(input: PackageInput): Promise<SubscriptionPackage> {
  return request<any>("/bizuno/packages", {
    method: "POST",
    body: JSON.stringify(packageRequest(input)),
  }).then((payload) => mapPackage((payload && typeof payload === "object" && "data" in payload ? (payload as { data: any }).data : payload) ?? {}));
}

export function listPackageScopes(): Promise<PackageScope[]> {
  return request<PackageScope[]>("/bizuno/packages/scopes");
}

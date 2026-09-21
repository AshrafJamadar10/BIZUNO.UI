import { useState, type ChangeEvent } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateTenant, usePlatformTenants, useSubscriptionPackages, useUpdateTenant } from "@/hooks/queries/platform";
import { formatDate, formatNumber } from "@/utils/format";
import { API_BASE_URL } from "@/services/apis/client";

export const Route = createFileRoute("/platform/tenants")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" });
  },
  component: TenantsPage,
});

function TenantsPage() {
  const { data: tenants = [] } = usePlatformTenants();
  const { data: packages = [] } = useSubscriptionPackages();
  const create = useCreateTenant();
  const update = useUpdateTenant();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "9999999999",
    password: "Bizuno@123",
    logo: null as File | null,
    ownerName: "",
    plan: "Growth",
  });

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => setForm({
    businessName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "9999999999",
    password: "Bizuno@123",
    logo: null,
    ownerName: "",
    plan: "Growth",
  });

  return (
    <PlatformShell>
      <PageHeader
        title="Tenants & businesses"
        description="Create and manage isolated business workspaces."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Create business
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit tenant workspace" : "Create tenant workspace"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Business name</Label>
                    <Input className="mt-1.5" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Subscription package</Label>
                    <select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.plan} onChange={(e) => set("plan", e.target.value)}>
                      {packages.map((pkg) => <option key={pkg.id}>{pkg.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Business logo <span className="text-muted-foreground">(optional)</span></Label>
                  <Input className="mt-1.5" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, logo: event.target.files?.[0] ?? null }))} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>First name</Label>
                    <Input className="mt-1.5" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input className="mt-1.5" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Email</Label>
                    <Input className="mt-1.5" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="mt-1.5" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Password</Label>
                  <Input className="mt-1.5" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  disabled={!form.businessName || !form.firstName || !form.lastName || !form.email || !form.phone || !form.password || create.isPending || update.isPending}
                  onClick={() => {
                    const payload = { ...form, ownerName: `${form.firstName} ${form.lastName}`.trim() };
                    const onSuccess = (response: unknown) => {
                      const message = typeof response === "object" && response && "message" in response
                        ? String((response as { message?: string }).message ?? "")
                        : "";
                      toast.success(message || (editingId ? "Tenant updated" : "Tenant workspace created"));
                      setOpen(false);
                      setEditingId(null);
                      resetForm();
                    };
                    const onError = (error: unknown) => {
                      toast.error(error instanceof Error ? error.message : "Unable to save tenant workspace");
                    };
                    if (editingId) update.mutate({ id: editingId, input: payload }, { onSuccess, onError });
                    else create.mutate(payload, { onSuccess, onError });
                  }}
                >
                  {create.isPending || update.isPending ? "Saving..." : editingId ? "Save changes" : "Create tenant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {tenant.logo ? <img src={tenant.logo.startsWith("http") ? tenant.logo : `${API_BASE_URL}/${tenant.logo.replace(/^\/+/, "")}`} alt="" className="size-10 rounded-md border object-cover" /> : <div className="flex size-10 items-center justify-center rounded-md border bg-muted text-xs font-semibold">{tenant.businessName.slice(0, 2).toUpperCase()}</div>}
                      <div>
                        <p className="font-medium">{tenant.businessName}</p>
                        <p className="text-xs text-muted-foreground">{tenant.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{tenant.ownerName}</TableCell>
                  <TableCell>{tenant.plan}</TableCell>
                  <TableCell>{formatNumber(tenant.users)}</TableCell>
                  <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                  <TableCell><StatusBadge status={tenant.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${tenant.businessName}`}
                      onClick={() => {
                        const parts = (tenant.ownerName ?? "Business Owner").split(/\s+/);
                        setEditingId(tenant.id);
                        setForm({
                          businessName: tenant.businessName,
                          firstName: parts[0] ?? "",
                          lastName: parts.slice(1).join(" ") || "Owner",
                          email: tenant.email,
                          phone: "9999999999",
                          password: "Bizuno@123",
                          logo: null,
                          ownerName: tenant.ownerName,
                          plan: tenant.plan,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </PlatformShell>
  );
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateCustomer, useCustomers, useDeleteCustomer, useUpdateCustomer } from "@/hooks/queries/customers";
import { formatCurrency, formatDate } from "@/utils/format";
import { ExportActions } from "@/components/common/ExportActions";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — BizUno" },
      {
        name: "description",
        content: "Manage customer accounts, GST details, credit limits and outstanding balances.",
      },
      { property: "og:title", content: "Customers — BizUno" },
      {
        property: "og:description",
        content: "Customer directory with purchase history and receivables.",
      },
    ],
  }),
  component: CustomersPage,
});

const EMPTY = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  city: "",
  state: "",
  address: "",
  status: "active" as "active" | "inactive",
};

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCustomers({ search, page, pageSize: 10 });
  const create = useCreateCustomer();
  const remove = useDeleteCustomer();
  const update = useUpdateCustomer();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        description="Every account you sell to, with live outstanding balances."
        crumbs={[{ label: "Home", to: "/" }, { label: "Customers" }]}
        actions={
          <>
          <ExportActions filename="customers" headers={["Name", "Contact", "Phone", "Email", "City", "Outstanding", "Status"]} rows={(data?.rows ?? []).map((customer) => [customer.name, customer.contactPerson, customer.phone, customer.email, customer.city, customer.outstanding, customer.status])} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit customer" : "Add customer"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Business name"],
                    ["contactPerson", "Contact person"],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["gstin", "GSTIN"],
                    ["city", "City"],
                    ["state", "State"],
                    ["address", "Address"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className={key === "address" ? "sm:col-span-2" : undefined}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}>
                  Cancel
                </Button>
                <Button
                  disabled={!form.name || create.isPending}
                  onClick={() => {
                    const onSuccess = () => {
                      toast.success(editingId ? "Customer updated" : "Customer added");
                      setOpen(false);
                      setEditingId(null);
                      setForm({ ...EMPTY });
                    };
                    if (editingId) update.mutate({ id: editingId, input: form }, { onSuccess });
                    else create.mutate(form, {
                      onSuccess: () => {
                        onSuccess();
                      },
                    });
                  }}
                >
                  {editingId ? "Save changes" : "Save customer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
        }
      />

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, city or phone"
            className="w-full sm:max-w-xs"
          />
          <span className="ml-auto text-xs text-muted-foreground">
            {data ? `${data.total} customers` : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Last order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: c.id }}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.contactPerson}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.city}, {c.state}
                    </TableCell>
                    <TableCell className="numeric text-sm">{c.phone}</TableCell>
                    <TableCell className="numeric text-right">
                      {formatCurrency(c.totalPurchases)}
                    </TableCell>
                    <TableCell className="numeric text-right font-medium">
                      {formatCurrency(c.outstanding)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.lastPurchaseAt ? formatDate(c.lastPurchaseAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => {
                          setEditingId(c.id);
                          setForm({
                            name: c.name,
                            contactPerson: c.contactPerson,
                            phone: c.phone,
                            email: c.email,
                            gstin: c.gstin ?? "",
                            city: c.city,
                            state: c.state,
                            address: c.address,
                            status: c.status,
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Try a different search, or add your first customer to get started."
          />
        )}

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete customer?"
        description="This removes the customer from your workspace. Invoice history stays intact."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          remove.mutate(deleteId, {
            onSuccess: () => {
              toast.success("Customer deleted");
              setDeleteId(null);
            },
          });
        }}
      />
    </AppShell>
  );
}

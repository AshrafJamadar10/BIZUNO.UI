import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomers } from "@/hooks/queries/customers";
import { useProducts } from "@/hooks/queries/products";
import { useCreateSale, useInvoices, useSalesSummary } from "@/hooks/queries/sales";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/sales/")({ component: SalesPage });

function SalesPage() {
  const [search, setSearch] = useState(""); const [open, setOpen] = useState(false); const [customerId, setCustomerId] = useState(""); const [productId, setProductId] = useState(""); const [quantity, setQuantity] = useState("1"); const [paid, setPaid] = useState("0");
  const { data: summary } = useSalesSummary(); const { data } = useInvoices({ search, pageSize: 50 }); const { data: customers } = useCustomers({ pageSize: 50 }); const { data: products } = useProducts({ pageSize: 50 }); const create = useCreateSale();
  return <AppShell><PageHeader title="Sales & Invoices" description="Create invoices, track payment status and follow order progress." crumbs={[{ label: "Home", to: "/" }, { label: "Sales & Invoices" }]} actions={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> New invoice</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create invoice</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Customer</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select customer</option>{customers?.rows.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></div><div><Label>Product</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Select product</option>{products?.rows.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><Label>Quantity</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div><Label>Amount paid</Label><Input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!customerId || !productId || create.isPending} onClick={() => create.mutate({ customerId, lines: [{ productId, quantity: Number(quantity), discountPercent: 0 }], dueInDays: 30, salesperson: "Ashraf Jamadar", amountPaid: Number(paid) }, { onSuccess: () => { toast.success("Invoice created"); setOpen(false); } })}>Create invoice</Button></DialogFooter></DialogContent></Dialog>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total sales" value={formatCurrency(summary?.totalSales ?? 0)} /><StatCard label="Invoices" value={formatNumber(summary?.invoiceCount ?? 0)} /><StatCard label="Collected" value={formatCurrency(summary?.paid ?? 0)} /><StatCard label="Outstanding" value={formatCurrency(summary?.pending ?? 0)} /></div><Card className="p-0"><div className="border-b p-4"><SearchInput value={search} onChange={setSearch} placeholder="Search invoice, customer or salesperson" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data?.rows.map((invoice) => <TableRow key={invoice.id}><TableCell className="font-medium">{invoice.number}</TableCell><TableCell>{invoice.customerName}</TableCell><TableCell>{formatDate(invoice.issuedAt)}</TableCell><TableCell className="numeric text-right">{formatCurrency(invoice.total)}</TableCell><TableCell className="numeric text-right">{formatCurrency(invoice.balance)}</TableCell><TableCell><StatusBadge status={invoice.paymentStatus} /></TableCell></TableRow>)}</TableBody></Table></div></Card></AppShell>;
}

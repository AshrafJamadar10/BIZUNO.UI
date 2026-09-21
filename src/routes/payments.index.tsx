import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices } from "@/hooks/queries/sales";
import { usePayments, useRecordPayment } from "@/hooks/queries/payments";
import { formatCurrency, formatDate } from "@/utils/format";
import { Pagination } from "@/components/common/Pagination";

export const Route = createFileRoute("/payments/")({ component: PaymentsPage });
function PaymentsPage() {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [open, setOpen] = useState(false); const [invoiceId, setInvoiceId] = useState(""); const [amount, setAmount] = useState(""); const [method, setMethod] = useState("");
  const { data } = usePayments({ search, page, pageSize }); const { data: invoices } = useInvoices({ pageSize: 50 }); const record = useRecordPayment();
  return <AppShell><PageHeader title="Payments" description="Record collections and keep customer balances up to date." crumbs={[{ label: "Home", to: "/" }, { label: "Payments" }]} actions={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><CreditCard className="size-4" /> Record payment</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Invoice</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}><option value="">Select invoice</option>{invoices?.rows.filter((invoice) => invoice.balance > 0).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} Â· {invoice.customerName} Â· {formatCurrency(invoice.balance)}</option>)}</select></div><div><Label>Amount</Label><Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></div><div><Label>Method</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}><option value="">Select method</option><option value="bank">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="cheque">Cheque</option></select></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!invoiceId || !amount || !method || record.isPending} onClick={() => record.mutate({ invoiceId, amount: Number(amount), method: method as "bank" | "cash" | "card" | "upi" | "cheque" }, { onSuccess: () => { toast.success("Payment recorded"); setOpen(false); setAmount(""); } })}>Save payment</Button></DialogFooter></DialogContent></Dialog>} /><Card className="p-0"><div className="border-b p-4"><SearchInput value={search} onChange={setSearch} placeholder="Search reference, customer or invoice" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Customer</TableHead><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data?.rows.map((payment) => <TableRow key={payment.id}><TableCell className="font-medium">{payment.reference}</TableCell><TableCell>{payment.partyName}</TableCell><TableCell>{payment.invoiceNumber}</TableCell><TableCell>{formatDate(payment.receivedAt)}</TableCell><TableCell className="capitalize">{payment.method}</TableCell><TableCell className="numeric text-right">{formatCurrency(payment.amount)}</TableCell><TableCell><StatusBadge status={payment.status} /></TableCell></TableRow>)}</TableBody></Table>  </div><Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} /></Card></AppShell>;
}


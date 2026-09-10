import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCancelInvoice, useInvoice } from "@/hooks/queries/sales";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/sales/$invoiceId")({ component: InvoiceDetailPage });

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  const { data: invoice } = useInvoice(invoiceId);
  const cancel = useCancelInvoice();
  if (!invoice) return <AppShell><Link to="/sales" className="text-sm text-primary hover:underline">Back to invoices</Link></AppShell>;
  return <AppShell><PageHeader title={invoice.number} description={`Issued ${formatDate(invoice.issuedAt)} · Due ${formatDate(invoice.dueAt)}`} crumbs={[{ label: "Sales & Invoices", to: "/sales" }, { label: invoice.number }]} actions={<><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print invoice</Button>{invoice.orderStatus !== "cancelled" && <Button variant="outline" onClick={() => cancel.mutate(invoice.id, { onSuccess: () => toast.success("Invoice cancelled") })}><XCircle className="size-4" /> Cancel</Button>}</>} /><Card className="print:shadow-none"><div className="flex flex-wrap justify-between gap-4 border-b p-6"><div><p className="text-lg font-semibold">BizUno</p><p className="text-sm text-muted-foreground">Nexus Traders Pvt Ltd</p></div><div className="text-right"><StatusBadge status={invoice.paymentStatus} /><p className="mt-2 text-sm text-muted-foreground">{invoice.customerName}</p></div></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{invoice.items.map((item) => <TableRow key={item.productId}><TableCell className="font-medium">{item.productName}</TableCell><TableCell>{item.sku}</TableCell><TableCell className="numeric text-right">{item.quantity}</TableCell><TableCell className="numeric text-right">{formatCurrency(item.unitPrice)}</TableCell><TableCell className="numeric text-right">{formatCurrency(item.total)}</TableCell></TableRow>)}</TableBody></Table></div><div className="ml-auto max-w-xs space-y-2 border-t p-6 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>{formatCurrency(invoice.discount)}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatCurrency(invoice.tax)}</span></div><div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div><div className="flex justify-between text-muted-foreground"><span>Paid</span><span>{formatCurrency(invoice.paid)}</span></div><div className="flex justify-between font-semibold"><span>Balance</span><span>{formatCurrency(invoice.balance)}</span></div></div></Card></AppShell>;
}

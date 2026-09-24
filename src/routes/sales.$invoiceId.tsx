import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Card as MuiCard,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Printer, XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button as UiButton } from "@/components/ui/button";
import { useCancelInvoice, useInvoice } from "@/hooks/queries/sales";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/sales/$invoiceId")({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const theme = useTheme();
  const { invoiceId } = Route.useParams();
  const { data: invoice } = useInvoice(invoiceId);
  const cancel = useCancelInvoice();

  if (!invoice) {
    return (
      <AppShell>
        <Box sx={{ p: 2 }}>
          <Link
            to="/sales"
            style={{
              fontSize: 14,
              color: theme.palette.primary.main,
              textDecoration: "none",
            }}
          >
            ← Back to invoices
          </Link>
        </Box>
      </AppShell>
    );
  }

  const summaryRows = [
    { label: "Subtotal", value: formatCurrency(invoice.subtotal) },
    { label: "Discount", value: formatCurrency(invoice.discount) },
    { label: "Tax", value: formatCurrency(invoice.tax) },
    { label: "Total", value: formatCurrency(invoice.total), emphasis: true },
    {
      label: "Paid",
      value: formatCurrency(invoice.paid),
      muted: true,
    },
    {
      label: "Balance",
      value: formatCurrency(invoice.balance),
      emphasis: true,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={invoice.number}
        description={`Issued ${formatDate(invoice.issuedAt)} · Due ${formatDate(invoice.dueAt)}`}
        crumbs={[
          { label: "Sales & Invoices", to: "/sales" },
          { label: invoice.number },
        ]}
        actions={
          <>
            <UiButton
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              Print invoice
            </UiButton>
            {invoice.orderStatus !== "cancelled" && (
              <UiButton
                variant="outline"
                onClick={() =>
                  cancel.mutate(invoice.id, {
                    onSuccess: () => toast.success("Invoice cancelled"),
                    onError: (error: Error) =>
                      toast.error(error.message),
                  })
                }
              >
                <XCircle className="size-4" />
                Cancel
              </UiButton>
            )}
          </>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MuiCard
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            bgcolor: theme.palette.background.paper,
            "@media print": {
              boxShadow: "none",
              border: "none",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 2,
              p: { xs: 2.5, sm: 3.5 },
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                }}
              >
                BizUno
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
              >
                Nexus Traders Pvt Ltd
              </Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <StatusBadge status={invoice.paymentStatus} />
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mt: 1 }}
              >
                {invoice.customerName}
              </Typography>
            </Box>
          </Box>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  {[
                    { label: "Item", align: "left" as const },
                    { label: "SKU", align: "left" as const },
                    { label: "Qty", align: "right" as const },
                    { label: "Unit price", align: "right" as const },
                    { label: "Total", align: "right" as const },
                  ].map((col) => (
                    <TableCell
                      key={col.label}
                      align={col.align}
                      sx={{
                        fontWeight: 600,
                        fontSize: 11.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: theme.palette.text.secondary,
                        bgcolor: alpha(
                          theme.palette.primary.main,
                          theme.palette.mode === "dark" ? 0.08 : 0.03
                        ),
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        py: 1.5,
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow
                    key={item.productId}
                    sx={{
                      "&:hover": {
                        bgcolor: alpha(
                          theme.palette.primary.main,
                          theme.palette.mode === "dark" ? 0.04 : 0.02
                        ),
                      },
                    }}
                  >
                    <TableCell
                      sx={{ fontSize: 13.5, fontWeight: 500 }}
                    >
                      {item.productName}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: 13,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {item.sku}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              px: { xs: 2.5, sm: 3.5 },
              py: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={1} sx={{ width: { xs: "100%", sm: 320 } }}>
              {summaryRows.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 14,
                    pt: row.emphasis ? 1 : 0,
                    borderTop: row.emphasis
                      ? `1px solid ${theme.palette.divider}`
                      : undefined,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: row.muted
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                      fontWeight: row.emphasis ? 600 : 400,
                    }}
                  >
                    {row.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: row.muted
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                      fontWeight: row.emphasis ? 700 : 500,
                    }}
                  >
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </MuiCard>
      </motion.div>

      <Box sx={{ mt: 2 }}>
        <Link
          to="/sales"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: theme.palette.text.secondary,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Back to invoices
        </Link>
      </Box>
    </AppShell>
  );
}
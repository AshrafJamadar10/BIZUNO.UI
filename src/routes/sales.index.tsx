import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Plus, Receipt } from "lucide-react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import UniversalTable, {
  type Column,
} from "@/components/MUI/UniversalTable";
import {
  FieldRenderer,
  evaluateCalculation,
  evaluateCondition,
  loadFormConfig,
  useBreakpoint,
  type FormConfig,
} from "@/utils/FormHandling/FormEngine";
import {
  useCreateSale,
  useInvoices,
  useSalesSummary,
} from "@/hooks/queries/sales";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

type Invoice = {
  id: string;
  number: string;
  customerName: string;
  issuedAt: string;
  total: number;
  balance: number;
  paymentStatus: string;
};

type TableRow = Invoice & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/sales/")({
  head: () => ({
    meta: [{ title: "Sales & Invoices — BizUno" }],
  }),
  component: SalesPage,
});

const SALESPERSON_DEFAULT = "Ashraf Jamadar";
const DUE_IN_DAYS_DEFAULT = 30;

function SalesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof Invoice>("issuedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [open, setOpen] = useState(false);
  const [schema, setSchema] = useState<FormConfig>({ fields: [] });

  const methods = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const { reset, handleSubmit, formState, control, setValue, getValues } =
    methods;

  const { data: summary } = useSalesSummary();
  const { data, isLoading } = useInvoices({ search, page, pageSize });
  const create = useCreateSale();

  useEffect(() => {
    const loaded = loadFormConfig("invoice");
    setSchema(loaded);
  }, []);

  const orderedFields = useMemo(
    () => [...schema.fields].sort((a, b) => a.order - b.order),
    [schema.fields],
  );

  const watchedValues = useWatch({ control }) as
    | Record<string, unknown>
    | undefined;

  const currentValues = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(watchedValues ?? {})) {
      out[k] = v === undefined || v === null ? "" : String(v);
    }
    return out;
  }, [watchedValues]);

  const visibleFields = useMemo(
    () =>
      orderedFields
        .filter((f) => f.type !== "heading" && f.type !== "divider")
        .filter((f) => evaluateCondition(f.condition, currentValues)),
    [orderedFields, currentValues],
  );

  useEffect(() => {
    for (const field of orderedFields) {
      if (!field.calculation.enabled) continue;
      const computed = evaluateCalculation(field.calculation, currentValues);
      const existing = getValues(field.name);
      if (existing !== computed) {
        setValue(field.name, computed, {
          shouldValidate: false,
          shouldDirty: false,
        });
      }
    }
  }, [orderedFields, currentValues, getValues, setValue]);

  const buildEmptyValues = useCallback((): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const f of orderedFields) {
      out[f.name] = f.defaultValue ?? "";
    }
    return out;
  }, [orderedFields]);

  const rows = useMemo<TableRow[]>(
    () => ((data?.rows ?? []) as Invoice[]).map((r) => ({ ...r })),
    [data],
  );

  const palette = useMemo(
    () => ({
      dialogBg: theme.palette.background.paper,
      dialogBorder: alpha(theme.palette.divider, isDark ? 0.5 : 0.7),
      textPrimary: theme.palette.text.primary,
      textMuted: theme.palette.text.secondary,
    }),
    [theme, isDark],
  );

  const handleOpenCreate = useCallback(() => {
    const defaults: Record<string, unknown> = buildEmptyValues();

    if (!defaults.salesperson) defaults.salesperson = SALESPERSON_DEFAULT;
    if (!defaults.quantity) defaults.quantity = "1";
    if (!defaults.paid || defaults.paid === "0") defaults.paid = "0";

    reset(defaults);
    setOpen(true);
  }, [reset, buildEmptyValues]);

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    reset(buildEmptyValues());
  }, [reset, buildEmptyValues]);

  const handleSort = useCallback((key: keyof Invoice, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "number",
        label: "Invoice",
        width: 160,
        sortable: true,
        render: (row) => (
          <Link
            to="/sales/$invoiceId"
            params={{ invoiceId: row.id }}
            style={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: 13.5,
              textDecoration: "none",
            }}
          >
            {row.number}
          </Link>
        ),
      },
      {
        key: "customerName",
        label: "Customer",
        width: 200,
      },
      {
        key: "issuedAt",
        label: "Date",
        width: 130,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatDate(row.issuedAt)}
          </Typography>
        ),
      },
      {
        key: "total",
        label: "Total",
        width: 130,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
            {formatCurrency(row.total)}
          </Typography>
        ),
      },
      {
        key: "balance",
        label: "Balance",
        width: 130,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
            {formatCurrency(row.balance)}
          </Typography>
        ),
      },
      {
        key: "paymentStatus",
        label: "Status",
        width: 120,
        align: "center",
        render: (row) => <StatusBadge status={row.paymentStatus} />,
      },
    ],
    [theme.palette.primary.main],
  );

  const submitForm = handleSubmit((values) => {
    const raw = values as Record<string, unknown>;

    const customerId = String(raw.customerId ?? "").trim();
    const productId = String(raw.productId ?? "").trim();
    const quantity = Number(raw.quantity ?? 1);
    const paid = Number(raw.paid ?? 0);

    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!productId) {
      toast.error("Please select a product");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!Number.isFinite(paid) || paid < 0) {
      toast.error("Amount paid must be 0 or more");
      return;
    }

    const payload = {
      customerId,
      lines: [
        {
          productId,
          quantity,
          discountPercent: 0,
        },
      ],
      dueInDays: DUE_IN_DAYS_DEFAULT,
      salesperson: String(raw.salesperson ?? SALESPERSON_DEFAULT),
      amountPaid: paid,
    };

    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Invoice created");
        setOpen(false);
        reset(buildEmptyValues());
      },
      onError: (error: Error) => toast.error(error.message),
    });
  });

  const totalCount = data?.total ?? 0;

  return (
    <AppShell>
      <UniversalTable<TableRow>
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        rowsPerPage={pageSize}
        showSrNo={false}
        tableSize="medium"

        header={{
          title: "Sales & Invoices",
          subtitle:
            "Create invoices, track payment status and follow order progress.",
          countLabel: (n) => `${n} invoices`,
        }}

        toolbar={{
          right: (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={handleOpenCreate}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontSize: 13,
                py: 0.75,
                px: 1.75,
                boxShadow: "none",
                bgcolor: theme.palette.primary.main,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: "none",
                },
              }}
            >
              New invoice
            </Button>
          ),
        }}

        search={{
          enabled: true,
          placeholder: "Search invoice, customer or salesperson",
          highlightColor: isDark ? "#facc15" : "#ffeb3b",
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
        }}

        export={{
          enabled: true,
          mode: "all",
          filename: "invoices",
          showExcel: true,
          showCSV: true,
          showPDF: true,
          showPrint: true,
          showCopy: false,
          showWord: false,
        }}

        sortable={{
          enabled: true,
          defaultKey: sortKey,
          defaultDir: sortDir,
          mode: "server",
          onChange: (key, dir) => handleSort(key as keyof Invoice, dir),
        }}

        mode={{
          type: "server",
          total: totalCount,
          page: page - 1,
          pageSize,
          onPageChange: (p) => setPage(p + 1),
        }}

        emptyState={{
          message: "No invoices found",
          description:
            "Try a different search, or create your first invoice to get started.",
          icon: (
            <Receipt
              size={48}
              style={{ color: palette.textMuted, opacity: 0.5 }}
            />
          ),
          action: {
            label: "Create invoice",
            onClick: handleOpenCreate,
            icon: <Plus size={14} />,
          },
        }}

        styles={{ paper: { borderRadius: 2 } }}
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          mt: 3,
        }}
      >
        <StatCard
          label="Total sales"
          value={formatCurrency(summary?.totalSales ?? 0)}
        />
        <StatCard
          label="Invoices"
          value={formatNumber(summary?.invoiceCount ?? 0)}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(summary?.paid ?? 0)}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary?.pending ?? 0)}
        />
      </Box>

      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              bgcolor: palette.dialogBg,
              border: `1px solid ${palette.dialogBorder}`,
              backgroundImage: "none",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: 20,
            color: palette.textPrimary,
            px: 3,
            pt: 2.5,
            pb: 0,
          }}
        >
          Create invoice
        </DialogTitle>

        <FormProvider {...methods}>
          <form onSubmit={submitForm} noValidate>
            <DialogContent sx={{ px: 3, pt: 2.5, pb: 2 }}>
              <Grid container rowSpacing={2} columnSpacing={2}>
                {visibleFields.map((field) => {
                  const layout = field.layout[breakpoint];
                  return (
                    <Grid
                      key={field.id}
                      size={{ xs: 12, sm: layout.colSpan }}
                    >
                      <FieldRenderer field={field} />
                    </Grid>
                  );
                })}
                {visibleFields.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      No fields configured. Add fields from the Form Handling tab
                      (form key: <code>invoice</code>).
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{
                  textTransform: "none",
                  borderColor: palette.dialogBorder,
                  color: palette.textPrimary,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={!formState.isValid || create.isPending}
                sx={{
                  textTransform: "none",
                  bgcolor: theme.palette.primary.main,
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                }}
              >
                Create invoice
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    </AppShell>
  );
}
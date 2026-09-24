import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
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
import { CreditCard, Plus } from "lucide-react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
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
import { usePayments, useRecordPayment } from "@/hooks/queries/payments";
import { formatCurrency, formatDate } from "@/utils/format";

type Payment = {
  id: string;
  reference: string;
  partyName: string;
  invoiceNumber: string;
  receivedAt: string;
  method: string;
  amount: number;
  status: string;
};

type TableRow = Payment & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/payments/")({
  head: () => ({
    meta: [{ title: "Payments — BizUno" }],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof Payment>("receivedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [open, setOpen] = useState(false);
  const [schema, setSchema] = useState<FormConfig>({ fields: [] });

  const methods = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const { reset, handleSubmit, formState, control, setValue, getValues } =
    methods;

  const { data, isLoading } = usePayments({ search, page, pageSize });
  const record = useRecordPayment();

  useEffect(() => {
    const loaded = loadFormConfig("payment");
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
    if (!out.method) out.method = "bank";
    return out;
  }, [orderedFields]);

  const rows = useMemo<TableRow[]>(
    () => ((data?.rows ?? []) as Payment[]).map((p) => ({ ...p })),
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

  const handleSort = useCallback((key: keyof Payment, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "reference",
        label: "Reference",
        width: 160,
        sortable: true,
        render: (row) => (
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: 13.5,
              color: theme.palette.primary.main,
            }}
          >
            {row.reference}
          </Typography>
        ),
      },
      {
        key: "partyName",
        label: "Customer",
        width: 180,
      },
      {
        key: "invoiceNumber",
        label: "Invoice",
        width: 150,
      },
      {
        key: "receivedAt",
        label: "Date",
        width: 130,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatDate(row.receivedAt)}
          </Typography>
        ),
      },
      {
        key: "method",
        label: "Method",
        width: 110,
        render: (row) => (
          <Typography
            variant="body2"
            sx={{
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {row.method}
          </Typography>
        ),
      },
      {
        key: "amount",
        label: "Amount",
        width: 130,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
            {formatCurrency(row.amount)}
          </Typography>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: 110,
        align: "center",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [theme.palette.primary.main],
  );

  const submitForm = handleSubmit((values) => {
    const raw = values as Record<string, unknown>;

    const invoiceId = String(raw.invoiceId ?? "").trim();
    const amountStr = String(raw.amount ?? "").trim();
    const method = String(raw.method ?? "bank") as
      | "bank"
      | "cash"
      | "card"
      | "upi"
      | "cheque";

    if (!invoiceId) {
      toast.error("Please select an invoice");
      return;
    }

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    record.mutate(
      { invoiceId, amount, method },
      {
        onSuccess: () => {
          toast.success("Payment recorded");
          setOpen(false);
          reset(buildEmptyValues());
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  });

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    reset(buildEmptyValues());
  }, [reset, buildEmptyValues]);

  const handleOpenCreate = useCallback(() => {
    reset(buildEmptyValues());
    setOpen(true);
  }, [reset, buildEmptyValues]);

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
          title: "Payments",
          subtitle:
            "Record collections and keep customer balances up to date.",
          countLabel: (n) => `${n} payments`,
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
              Record payment
            </Button>
          ),
        }}

        search={{
          enabled: true,
          placeholder: "Search reference, customer or invoice",
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
          filename: "payments",
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
          onChange: (key, dir) => handleSort(key as keyof Payment, dir),
        }}

        mode={{
          type: "server",
          total: totalCount,
          page: page - 1,
          pageSize,
          onPageChange: (p) => setPage(p + 1),
        }}

        emptyState={{
          message: "No payments recorded",
          description:
            "Try a different search, or record your first payment to get started.",
          icon: (
            <CreditCard
              size={48}
              style={{ color: palette.textMuted, opacity: 0.5 }}
            />
          ),
          action: {
            label: "Record payment",
            onClick: handleOpenCreate,
            icon: <Plus size={14} />,
          },
        }}

        styles={{ paper: { borderRadius: 2 } }}
      />

      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="sm"
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
          Record payment
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
                      (form key: <code>payment</code>).
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
                disabled={!formState.isValid || record.isPending}
                sx={{
                  textTransform: "none",
                  bgcolor: theme.palette.primary.main,
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                }}
              >
                Save payment
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    </AppShell>
  );
}
import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { Plus, Truck } from "lucide-react";
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
  ACTION_KEY,
  type Column,
} from "@/components/MUI/UniversalTable";
import { Card } from "@/components/ui/card";
import {
  FieldRenderer,
  evaluateCalculation,
  evaluateCondition,
  loadFormConfig,
  useBreakpoint,
  type FormConfig,
} from "@/utils/FormHandling/FormEngine";
import {
  useCreateSupplier,
  usePurchaseOrders,
  useSuppliers,
  useUpdateSupplier,
} from "@/hooks/queries/suppliers";
import { formatCurrency, formatDate } from "@/utils/format";

type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  city: string;
  outstanding: number;
  status: "active" | "inactive";
};

type TableRow = Supplier & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/suppliers/")({
  head: () => ({
    meta: [{ title: "Suppliers — BizUno" }],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof Supplier>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [schema, setSchema] = useState<FormConfig>({ fields: [] });

  const methods = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const { reset, handleSubmit, formState, control, setValue, getValues } =
    methods;

  const { data, isLoading } = useSuppliers({ search, page, pageSize });
  const { data: orders } = usePurchaseOrders({ pageSize: 50 });
  const create = useCreateSupplier();
  const update = useUpdateSupplier();

  useEffect(() => {
    const loaded = loadFormConfig("supplier");
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

  const buildValuesFromRow = useCallback(
    (row: TableRow): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      for (const f of orderedFields) {
        const raw = (row as Record<string, unknown>)[f.name];
        out[f.name] =
          raw === undefined || raw === null ? f.defaultValue ?? "" : raw;
      }
      return out;
    },
    [orderedFields],
  );

  const rows = useMemo<TableRow[]>(
    () => ((data?.rows ?? []) as Supplier[]).map((s) => ({ ...s })),
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

  const handleEdit = useCallback(
    (row: TableRow) => {
      setEditingId(row.id);
      reset(buildValuesFromRow(row));
      setOpen(true);
    },
    [reset, buildValuesFromRow],
  );

  const handleSort = useCallback((key: keyof Supplier, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "name",
        label: "Supplier",
        width: 220,
        sortable: true,
        render: (row) => (
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography
              component="span"
              sx={{
                fontWeight: 600,
                fontSize: 13.5,
                color: theme.palette.primary.main,
                lineHeight: 1.3,
              }}
            >
              {row.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: palette.textMuted, fontSize: 11.5, mt: 0.25 }}
            >
              {row.gstin || "GSTIN not added"}
            </Typography>
          </Box>
        ),
      },
      {
        key: "contactPerson",
        label: "Contact",
        width: 180,
        render: (row) => (
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              {row.contactPerson}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: palette.textMuted, fontSize: 11.5 }}
            >
              {row.phone}
            </Typography>
          </Box>
        ),
      },
      {
        key: "city",
        label: "City",
        width: 140,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {row.city}
          </Typography>
        ),
      },
      {
        key: "outstanding",
        label: "Outstanding",
        width: 140,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
            {formatCurrency(row.outstanding)}
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
      {
        key: ACTION_KEY,
        label: "Actions",
        align: "center",
        width: 90,
      },
    ],
    [palette.textMuted, theme.palette.primary.main],
  );

  const actions = useMemo(
    () => ({
      edit: handleEdit,
    }),
    [handleEdit],
  );

  const submitForm = handleSubmit((values) => {
    const payload = values as Record<string, unknown>;

    const onSuccess = () => {
      toast.success(editingId ? "Supplier updated" : "Supplier added");
      setOpen(false);
      setEditingId(null);
      reset(buildEmptyValues());
    };

    const onError = (error: Error) => toast.error(error.message);

    if (editingId) {
      update.mutate(
        { id: editingId, input: payload as never },
        { onSuccess, onError },
      );
    } else {
      create.mutate(payload as never, { onSuccess, onError });
    }
  });

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    reset(buildEmptyValues());
  }, [reset, buildEmptyValues]);

  const handleOpenCreate = useCallback(() => {
    setEditingId(null);
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
          title: "Suppliers & Purchasing",
          subtitle:
            "Manage vendor relationships, purchase orders and incoming stock.",
          countLabel: (n) => `${n} suppliers`,
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
              New supplier
            </Button>
          ),
        }}

        search={{
          enabled: true,
          placeholder: "Search suppliers, city or contact",
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
          filename: "suppliers",
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
          onChange: (key, dir) => handleSort(key as keyof Supplier, dir),
        }}

        mode={{
          type: "server",
          total: totalCount,
          page: page - 1,
          pageSize,
          onPageChange: (p) => setPage(p + 1),
        }}

        actions={actions}

        emptyState={{
          message: "No suppliers found",
          description:
            "Try a different search, or add your first supplier to get started.",
          icon: (
            <Truck
              size={48}
              style={{ color: palette.textMuted, opacity: 0.5 }}
            />
          ),
          action: {
            label: "Add supplier",
            onClick: handleOpenCreate,
            icon: <Plus size={14} />,
          },
        }}

        styles={{ paper: { borderRadius: 2 } }}
      />

      <Box sx={{ mt: 3 }}>
        <Card className="p-0">
          <Box
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              p: 2,
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
              Purchase orders
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.textMuted, mt: 0.5, fontSize: 12.5 }}
            >
              Recent orders placed with suppliers.
            </Typography>
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    background: alpha(
                      theme.palette.primary.main,
                      isDark ? 0.08 : 0.03,
                    ),
                    color: theme.palette.text.secondary,
                    fontSize: 11.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                    Order
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                    Supplier
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                    Issued
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                    Expected
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Total
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders?.rows.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {order.number}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: theme.palette.text.primary,
                      }}
                    >
                      {order.supplierName}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {formatDate(order.issuedAt)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {formatDate(order.expectedAt)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {formatCurrency(order.total)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {!orders?.rows.length && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "40px 16px",
                        textAlign: "center",
                        color: theme.palette.text.secondary,
                        fontSize: 13,
                      }}
                    >
                      No purchase orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mt: 2,
          color: palette.textMuted,
          fontSize: 13,
        }}
      >
        <Truck size={16} />
        Purchase receiving and stock reconciliation are ready to connect to
        the backend inventory ledger.
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
          {editingId ? "Edit supplier" : "Add supplier"}
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
                      (form key: <code>supplier</code>).
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
                disabled={
                  !formState.isValid ||
                  create.isPending ||
                  update.isPending
                }
                sx={{
                  textTransform: "none",
                  bgcolor: theme.palette.primary.main,
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                }}
              >
                {editingId ? "Save changes" : "Save supplier"}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    </AppShell>
  );
}
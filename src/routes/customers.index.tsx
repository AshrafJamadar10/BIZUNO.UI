import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Plus, Users, Archive, Mail } from "lucide-react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import UniversalTable, {
  ACTION_KEY,
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
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/hooks/queries/customers";
import type { CustomerInput } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

type Customer = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  city: string;
  state: string;
  address: string;
  status: "active" | "inactive";
  totalPurchases: number;
  outstanding: number;
  lastPurchaseAt?: string;
};

type TableRow = Customer & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [{ title: "Customers — BizUno" }],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Customer>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [schema, setSchema] = useState<FormConfig>({ fields: [] });

  const methods = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const { reset, handleSubmit, formState, control, setValue, getValues } = methods;

  const { data, isLoading } = useCustomers({ search, page, pageSize });
  const create = useCreateCustomer();
  const remove = useDeleteCustomer();
  const update = useUpdateCustomer();

  useEffect(() => {
    const loaded = loadFormConfig("customer");
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
    () => ((data?.rows ?? []) as Customer[]).map((r) => ({ ...r })),
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

  const handleDelete = useCallback((row: TableRow) => {
    setDeleteId(row.id);
  }, []);

  const handleRowClick = useCallback(
    (row: TableRow) => {
      navigate({
        to: "/customers/$customerId",
        params: { customerId: row.id },
      });
    },
    [navigate],
  );

  const handleSort = useCallback((key: keyof Customer, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "name",
        label: "Customer",
        width: 200,
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
              {row.contactPerson}
            </Typography>
          </Box>
        ),
      },
      {
        key: "city",
        label: "Location",
        width: 130,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {row.city}
          </Typography>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        width: 130,
        align: "left",
      },
      {
        key: "totalPurchases",
        label: "Purchases",
        align: "right",
        width: 120,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
            {formatCurrency(row.totalPurchases)}
          </Typography>
        ),
      },
      {
        key: "outstanding",
        label: "Outstanding",
        align: "right",
        width: 120,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
            {formatCurrency(row.outstanding)}
          </Typography>
        ),
      },
      {
        key: "lastPurchaseAt",
        label: "Last order",
        width: 110,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {row.lastPurchaseAt ? formatDate(row.lastPurchaseAt) : "—"}
          </Typography>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: 100,
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
      delete: handleDelete,
    }),
    [handleEdit, handleDelete],
  );

  const submitForm = handleSubmit((values) => {
    const payload = values as unknown as CustomerInput;

    const onSuccess = () => {
      toast.success(editingId ? "Customer updated" : "Customer added");
      setOpen(false);
      setEditingId(null);
      reset(buildEmptyValues());
    };

    if (editingId) {
      update.mutate({ id: editingId, input: payload }, { onSuccess });
    } else {
      create.mutate(payload, { onSuccess });
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

  const handleBulkArchive = useCallback(
    (selected: TableRow[]) => {
      selected.forEach((row) => {
        update.mutate({
          id: row.id,
          input: {
            ...(row as unknown as CustomerInput),
            status: "inactive",
          },
        });
      });
      toast.success(`Archived ${selected.length} customer(s)`);
    },
    [update],
  );

  const handleBulkEmail = useCallback((selected: TableRow[]) => {
    const emails = selected
      .map((r) => r.email)
      .filter((e): e is string => Boolean(e))
      .join(",");
    if (!emails) {
      toast.error("No email addresses available");
      return;
    }
    window.location.href = `mailto:${emails}`;
  }, []);

  const handleBulkDelete = useCallback(
    (selected: TableRow[]) => {
      selected.forEach((row) => {
        remove.mutate(row.id, {
          onSuccess: () => toast.success(`${row.name} deleted`),
        });
      });
    },
    [remove],
  );

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
          title: "Customers",
          subtitle:
            "Every account you sell to, with live outstanding balances.",
          countLabel: (n) => `${n} customers`,
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
              New customer
            </Button>
          ),
        }}
        search={{
          enabled: true,
          placeholder: "Search by name, city or phone",
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
          filename: "customers",
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
          onChange: (key, dir) => handleSort(key as keyof Customer, dir),
        }}
        mode={{
          type: "server",
          total: totalCount,
          page: page - 1,
          pageSize,
          onPageChange: (p) => setPage(p + 1),
        }}
        rowClick={{ target: "all", handler: handleRowClick }}
        actions={actions}
        enableCheckbox
        bulkActions={[
          {
            key: "archive",
            label: "Archive selected",
            icon: <Archive size={16} />,
            onClick: handleBulkArchive,
          },
          {
            key: "email",
            label: "Email selected",
            icon: <Mail size={16} />,
            color: theme.palette.primary.main,
            onClick: handleBulkEmail,
          },
        ]}
        onDeleteSelected={handleBulkDelete}
        emptyState={{
          message: "No customers found",
          description:
            "Try a different search, or add your first customer to get started.",
          icon: (
            <Users size={48} style={{ color: palette.textMuted, opacity: 0.5 }} />
          ),
          action: {
            label: "Add customer",
            onClick: handleOpenCreate,
            icon: <Plus size={14} />,
          },
        }}
        styles={{ paper: { borderRadius: 2 } }}
      />

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
          {editingId ? "Edit customer" : "Add customer"}
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
                      No fields configured. Add fields from the Form Handling tab.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                gap: 1,
              }}
            >
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
                {editingId ? "Save changes" : "Save customer"}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>

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
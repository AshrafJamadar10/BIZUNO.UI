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
import { Plus, Package } from "lucide-react";
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
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/queries/products";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { ProductInput } from "@/types";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  minStock: number;
  warehouseId: string;
  status: "active" | "inactive";
  description?: string;
  createdAt: string;
};

type TableRow = Product & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [{ title: "Products — BizUno" }],
  }),
  component: ProductsPage,
});

const NUMERIC_KEYS = new Set([
  "purchasePrice",
  "sellingPrice",
  "taxRate",
  "stock",
  "minStock",
]);

function ProductsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Product>("name");
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

  const { data, isLoading } = useProducts({ search, page, pageSize });
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  useEffect(() => {
    const loaded = loadFormConfig("product");
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
    () => ((data?.rows ?? []) as Product[]).map((r) => ({ ...r })),
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

  const handleSort = useCallback((key: keyof Product, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "name",
        label: "Product",
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
              {row.barcode}
            </Typography>
          </Box>
        ),
      },
      {
        key: "sku",
        label: "SKU",
        width: 130,
      },
      {
        key: "categoryName",
        label: "Category",
        width: 140,
      },
      {
        key: "sellingPrice",
        label: "Price",
        width: 120,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
            {formatCurrency(row.sellingPrice)}
          </Typography>
        ),
      },
      {
        key: "stock",
        label: "Stock",
        width: 120,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatNumber(row.stock)} {row.unit}
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
    const raw = values as Record<string, unknown>;

    const payload = { ...raw } as Record<string, unknown>;
    for (const key of Object.keys(payload)) {
      if (NUMERIC_KEYS.has(key)) {
        const n = Number(payload[key]);
        if (!Number.isNaN(n)) payload[key] = n;
      }
    }

    const typedPayload = payload as unknown as ProductInput;

    const onSuccess = () => {
      toast.success(editingId ? "Product updated" : "Product added");
      setOpen(false);
      setEditingId(null);
      reset(buildEmptyValues());
    };

    if (editingId) {
      update.mutate({ id: editingId, input: typedPayload }, { onSuccess });
    } else {
      create.mutate(typedPayload, { onSuccess });
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
          title: "Products",
          subtitle:
            "Manage your catalogue, pricing and product availability.",
          countLabel: (n) => `${n} products`,
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
              New product
            </Button>
          ),
        }}

        search={{
          enabled: true,
          placeholder: "Search products, SKU or barcode",
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
          filename: "products",
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
          onChange: (key, dir) => handleSort(key as keyof Product, dir),
        }}

        mode={{
          type: "server",
          total: totalCount,
          page: page - 1,
          pageSize,
          onPageChange: (p) => setPage(p + 1),
        }}

        actions={actions}

        enableCheckbox
        onDeleteSelected={handleBulkDelete}

        emptyState={{
          message: "No products found",
          description:
            "Try a different search, or add your first product to get started.",
          icon: (
            <Package size={48} style={{ color: palette.textMuted, opacity: 0.5 }} />
          ),
          action: {
            label: "Add product",
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
          {editingId ? "Edit product" : "Add product"}
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
                {editingId ? "Save changes" : "Save product"}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete product?"
        description="This removes the product from your catalogue. Historical invoices keep their data."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          remove.mutate(deleteId, {
            onSuccess: () => {
              toast.success("Product deleted");
              setDeleteId(null);
            },
          });
        }}
      />
    </AppShell>
  );
}
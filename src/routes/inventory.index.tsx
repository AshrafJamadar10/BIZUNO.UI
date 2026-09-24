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
import { Boxes, PackageX, Warehouse as WarehouseIcon, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/common/StatCard";
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
  useInventory,
  useInventorySummary,
  useWarehouses,
} from "@/hooks/queries/inventory";
import { useUpdateProduct } from "@/hooks/queries/products";
import { stockStatusOf } from "@/services/inventory";
import { formatCurrency, formatNumber } from "@/utils/format";

type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  warehouseId: string;
  unit: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
};

type TableRow = InventoryRow & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/inventory/")({
  head: () => ({
    meta: [{ title: "Inventory — BizUno" }],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof InventoryRow>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormConfig>({ fields: [] });

  const methods = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const { reset, handleSubmit, formState, control, setValue, getValues } = methods;

  const { data: summary } = useInventorySummary();
  const { data: warehouses = [] } = useWarehouses();
  const { data, isLoading } = useInventory({ search, page, pageSize });
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    const loaded = loadFormConfig("inventory");
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

  const warehouseNameById = useMemo(() => {
    const map = new Map<string, string>();
    warehouses.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [warehouses]);

  const rows = useMemo<TableRow[]>(
    () =>
      ((data?.rows ?? []) as InventoryRow[]).map((p) => ({
        ...p,
        stockValue: p.stock * p.purchasePrice,
      })),
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

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    reset(buildEmptyValues());
  }, [reset, buildEmptyValues]);

  const handleSort = useCallback((key: keyof InventoryRow, dir: SortDir) => {
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
              {row.sku}
            </Typography>
          </Box>
        ),
      },
      {
        key: "warehouseId",
        label: "Warehouse",
        width: 160,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {warehouseNameById.get(row.warehouseId) ?? row.warehouseId}
          </Typography>
        ),
      },
      {
        key: "stock",
        label: "Quantity",
        width: 130,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
            {formatNumber(row.stock)} {row.unit}
          </Typography>
        ),
      },
      {
        key: "minStock",
        label: "Min. stock",
        width: 120,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatNumber(row.minStock)}
          </Typography>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: 120,
        align: "center",
        render: (row) => <StatusBadge status={stockStatusOf(row as never)} />,
      },
      {
        key: "stockValue",
        label: "Value",
        width: 130,
        align: "right",
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
            {formatCurrency(row.stock * row.purchasePrice)}
          </Typography>
        ),
      },
      {
        key: ACTION_KEY,
        label: "Actions",
        align: "center",
        width: 90,
      },
    ],
    [palette.textMuted, theme.palette.primary.main, warehouseNameById],
  );

  const actions = useMemo(
    () => ({
      edit: handleEdit,
    }),
    [handleEdit],
  );

  const submitForm = handleSubmit((values) => {
    if (!editingId) return;

    const raw = values as Record<string, unknown>;
    const payload: Record<string, unknown> = { ...raw };

    if ("stock" in payload) {
      const n = Number(payload.stock);
      payload.stock = Number.isNaN(n) ? 0 : n;
    }

    updateProduct.mutate(
      { id: editingId, input: payload as never },
      {
        onSuccess: () => {
          toast.success("Inventory updated");
          setOpen(false);
          setEditingId(null);
          reset(buildEmptyValues());
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  });

  const totalCount = data?.total ?? 0;

  return (
    <AppShell>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          mb: 2,
        }}
      >
        <Button
          component={Link}
          to="/warehouses"
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            borderColor: palette.dialogBorder,
            color: palette.textPrimary,
          }}
        >
          Manage warehouses
        </Button>
        <Button
          component={Link}
          to="/products"
          variant="contained"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            "&:hover": { bgcolor: theme.palette.primary.dark },
          }}
        >
          Add product
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          mb: 3,
        }}
      >
        <StatCard
          label="Products"
          value={formatNumber(summary?.totalProducts ?? 0)}
          icon={Boxes}
        />
        <StatCard
          label="Units on hand"
          value={formatNumber(summary?.totalUnits ?? 0)}
          icon={WarehouseIcon}
        />
        <StatCard
          label="Low stock"
          value={formatNumber(summary?.lowStock ?? 0)}
          icon={ArrowRightLeft}
        />
        <StatCard
          label="Stock value"
          value={formatCurrency(summary?.stockValue ?? 0)}
          icon={PackageX}
        />
      </Box>

      <Card className="p-0">
        <UniversalTable<TableRow>
          data={rows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          rowsPerPage={pageSize}
          showSrNo={false}
          tableSize="medium"

          header={{
            title: "Inventory",
            subtitle:
              "Monitor stock levels, warehouse locations and inventory value.",
            countLabel: (n) => `${n} items`,
          }}

          search={{
            enabled: true,
            placeholder: "Search products or SKU",
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
            filename: "inventory",
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
            onChange: (key, dir) =>
              handleSort(key as keyof InventoryRow, dir),
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
            message: "No inventory items found",
            description:
              "Try a different search, or add products to start tracking stock.",
            icon: (
              <Boxes
                size={48}
                style={{ color: palette.textMuted, opacity: 0.5 }}
              />
            ),
          }}

          styles={{ paper: { borderRadius: 2 } }}
        />
      </Card>

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
          Edit inventory
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
                      (form key: <code>inventory</code>).
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
                  updateProduct.isPending
                }
                sx={{
                  textTransform: "none",
                  bgcolor: theme.palette.primary.main,
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                }}
              >
                Save changes
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    </AppShell>
  );
}
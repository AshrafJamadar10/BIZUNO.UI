import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
import { Plus, Building2 } from "lucide-react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
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
  useCreateTenant,
  usePlatformTenants,
  useSubscriptionPackages,
  useUpdateTenant,
} from "@/hooks/queries/platform";
import { formatDate, formatNumber } from "@/utils/format";

type Tenant = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  plan: string;
  users: number;
  createdAt: string;
  status: "active" | "inactive";
};

type TableRow = Tenant & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/platform/tenants")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") {
      throw redirect({ to: "/platform/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Businesses — Platform" }],
  }),
  component: TenantsPage,
});

function TenantsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Tenant>("businessName");
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

  const { data: tenants = [] } = usePlatformTenants();
  const { data: packages = [] } = useSubscriptionPackages();
  const create = useCreateTenant();
  const update = useUpdateTenant();

  useEffect(() => {
    const loaded = loadFormConfig("platform_tenant");
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
    if (!out.plan && packages.length) {
      out.plan = packages[0]?.name ?? "Growth";
    }
    return out;
  }, [orderedFields, packages]);

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
    () => (tenants as Tenant[]).map((t) => ({ ...t })),
    [tenants],
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.businessName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.plan.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filteredRows, sortKey, sortDir]);

  const paginatedRows = useMemo(
    () => sortedRows.slice((page - 1) * pageSize, page * pageSize),
    [sortedRows, page, pageSize],
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

  const handleSort = useCallback((key: keyof Tenant, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "businessName",
        label: "Business",
        width: 220,
        sortable: true,
        render: (row) => (
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 600,
                fontSize: 13.5,
                color: theme.palette.primary.main,
                lineHeight: 1.3,
              }}
            >
              {row.businessName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: palette.textMuted, fontSize: 11.5, mt: 0.25 }}
            >
              {row.email}
            </Typography>
          </span>
        ),
      },
      {
        key: "ownerName",
        label: "Owner",
        width: 180,
      },
      {
        key: "plan",
        label: "Plan",
        width: 140,
      },
      {
        key: "users",
        label: "Users",
        width: 100,
        align: "right",
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
            {formatNumber(row.users)}
          </Typography>
        ),
      },
      {
        key: "createdAt",
        label: "Created",
        width: 140,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatDate(row.createdAt)}
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
      toast.success(
        editingId ? "Tenant updated" : "Tenant workspace created",
      );
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

  const totalCount = sortedRows.length;

  return (
    <PlatformShell>
      <UniversalTable<TableRow>
        data={paginatedRows}
        columns={columns}
        getRowId={(row) => row.id}
        rowsPerPage={pageSize}
        showSrNo={false}
        tableSize="medium"

        header={{
          title: "Businesses",
          subtitle: "Create and manage isolated business workspaces.",
          countLabel: () => `${totalCount} businesses`,
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
              Create business
            </Button>
          ),
        }}

        search={{
          enabled: true,
          placeholder: "Search businesses, owners or plans",
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
          filename: "platform-tenants",
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
          mode: "client",
          onChange: (key, dir) => handleSort(key as keyof Tenant, dir),
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
          message: "No businesses found",
          description:
            "Try a different search, or create the first business workspace.",
          icon: (
            <Building2
              size={48}
              style={{ color: palette.textMuted, opacity: 0.5 }}
            />
          ),
          action: {
            label: "Create business",
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
          {editingId ? "Edit business" : "Create business"}
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
                      (form key: <code>platform_tenant</code>).
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
                {editingId ? "Save changes" : "Create business"}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    </PlatformShell>
  );
}
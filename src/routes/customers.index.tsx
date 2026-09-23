import { useState, useMemo, useCallback } from "react";
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
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import UniversalTable, {
  ACTION_KEY,
  type Column,
} from "@/components/MUI/UniversalTable";
import TextInputField from "@/components/MUI/TextInputField";
import MobileField from "@/components/MUI/MobileField";
import EmailField from "@/components/MUI/EmailField";
import RadioField from "@/components/MUI/RadioField";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/hooks/queries/customers";
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

type CustomerForm = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  city: string;
  state: string;
  address: string;
  status: "active" | "inactive";
};

type SortDir = "asc" | "desc";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [{ title: "Customers — BizUno" }],
  }),
  component: CustomersPage,
});

const EMPTY_FORM: CustomerForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  city: "",
  state: "",
  address: "",
  status: "active",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function CustomersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Customer>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const methods = useForm<CustomerForm>({
    defaultValues: EMPTY_FORM,
    mode: "onChange",
  });

  const { reset, handleSubmit, formState } = methods;

  const { data, isLoading } = useCustomers({ search, page, pageSize });
  const create = useCreateCustomer();
  const remove = useDeleteCustomer();
  const update = useUpdateCustomer();

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
      reset({
        name: row.name,
        contactPerson: row.contactPerson,
        phone: row.phone,
        email: row.email,
        gstin: row.gstin ?? "",
        city: row.city,
        state: row.state,
        address: row.address,
        status: row.status,
      });
      setOpen(true);
    },
    [reset],
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
    const onSuccess = () => {
      toast.success(editingId ? "Customer updated" : "Customer added");
      setOpen(false);
      setEditingId(null);
      reset(EMPTY_FORM);
    };

    if (editingId) {
      update.mutate({ id: editingId, input: values }, { onSuccess });
    } else {
      create.mutate(values, { onSuccess });
    }
  });

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    reset(EMPTY_FORM);
  }, [reset]);

  const handleOpenCreate = useCallback(() => {
    setEditingId(null);
    reset(EMPTY_FORM);
    setOpen(true);
  }, [reset]);

  const handleBulkArchive = useCallback(
    (selected: TableRow[]) => {
      selected.forEach((row) => {
        update.mutate({
          id: row.id,
          input: {
            name: row.name,
            contactPerson: row.contactPerson,
            phone: row.phone,
            email: row.email,
            gstin: row.gstin ?? "",
            city: row.city,
            state: row.state,
            address: row.address,
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
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
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
            fontSize: 18,
            color: palette.textPrimary,
            borderBottom: `1px solid ${palette.dialogBorder}`,
            pb: 1.5,
          }}
        >
          {editingId ? "Edit customer" : "Add customer"}
        </DialogTitle>

        <FormProvider {...methods}>
          <form onSubmit={submitForm} noValidate>
            <DialogContent sx={{ pt: 2.5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextInputField
                    name="name"
                    label="Business name"
                    required
                    inputType="alphanumeric"
                    maxLength={80}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextInputField
                    name="contactPerson"
                    label="Contact person"
                    inputType="alphabet"
                    maxLength={60}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MobileField name="phone" label="Phone" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EmailField name="email" label="Email" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextInputField
                    name="gstin"
                    label="GSTIN"
                    inputType="alphanumeric"
                    maxLength={15}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextInputField
                    name="city"
                    label="City"
                    inputType="alphabet"
                    maxLength={50}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextInputField
                    name="state"
                    label="State"
                    inputType="alphabet"
                    maxLength={50}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RadioField
                    name="status"
                    label="Status"
                    options={STATUS_OPTIONS}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextInputField
                    name="address"
                    label="Address"
                    inputType="all"
                    rows={2}
                    maxLength={200}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions
              sx={{
                p: 2,
                borderTop: `1px solid ${palette.dialogBorder}`,
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
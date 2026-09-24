import { useState, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import {  useTheme } from "@mui/material";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import UniversalTable, {
  type Column,
} from "@/components/MUI/UniversalTable";
import { usePurchaseOrders } from "@/hooks/queries/suppliers";
import { formatCurrency, formatDate } from "@/utils/format";

type PurchaseOrder = {
  id: string;
  number: string;
  supplierName: string;
  issuedAt: string;
  expectedAt: string;
  total: number;
  status: string;
};

type TableRow = PurchaseOrder & Record<string, unknown>;
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/purchases/")({
  head: () => ({
    meta: [{ title: "Purchases — BizUno" }],
  }),
  component: PurchasesPage,
});

function PurchasesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof PurchaseOrder>("issuedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading } = usePurchaseOrders({ search, page, pageSize });

  const rows = useMemo<TableRow[]>(
    () => ((data?.rows ?? []) as PurchaseOrder[]).map((r) => ({ ...r })),
    [data],
  );

  const palette = useMemo(
    () => ({
      textMuted: theme.palette.text.secondary,
    }),
    [theme],
  );

  const handleSort = useCallback((key: keyof PurchaseOrder, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "number",
        label: "Purchase order",
        width: 180,
        sortable: true,
        render: (row) => (
          <span
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              color: theme.palette.primary.main,
            }}
          >
            {row.number}
          </span>
        ),
      },
      {
        key: "supplierName",
        label: "Supplier",
        width: 200,
      },
      {
        key: "issuedAt",
        label: "Issued",
        width: 130,
        sortable: true,
        render: (row) => (
          <span style={{ fontSize: 13, color: palette.textMuted }}>
            {formatDate(row.issuedAt)}
          </span>
        ),
      },
      {
        key: "expectedAt",
        label: "Expected",
        width: 130,
        sortable: true,
        render: (row) => (
          <span style={{ fontSize: 13, color: palette.textMuted }}>
            {formatDate(row.expectedAt)}
          </span>
        ),
      },
      {
        key: "total",
        label: "Total",
        width: 140,
        align: "right",
        sortable: true,
        render: (row) => (
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {formatCurrency(row.total)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: 120,
        align: "center",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [theme.palette.primary.main, palette.textMuted],
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
          title: "Purchases",
          subtitle:
            "Track purchase orders, expected deliveries and supplier spending.",
          countLabel: (n) => `${n} purchase orders`,
        }}

        search={{
          enabled: true,
          placeholder: "Search purchase order, supplier or status",
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
          filename: "purchases",
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
          onChange: (key, dir) => handleSort(key as keyof PurchaseOrder, dir),
        }}

        mode={{
          type: "server",
          total: totalCount,
          page: page - 1,
          pageSize,
          onPageChange: (p) => setPage(p + 1),
        }}

        emptyState={{
          message: "No purchase orders found",
          description:
            "Try a different search, or create purchase orders from the Suppliers page.",
          icon: (
            <ShoppingCart
              size={48}
              style={{ color: palette.textMuted, opacity: 0.5 }}
            />
          ),
        }}

        styles={{ paper: { borderRadius: 2 } }}
      />
    </AppShell>
  );
}
import { useMemo } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Box, Typography, useTheme } from "@mui/material";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import UniversalTable, {
  type Column,
} from "@/components/MUI/UniversalTable";
import { useTenantSubscriptions } from "@/hooks/queries/platform";
import { formatCurrency, formatDate } from "@/utils/format";

type Subscription = {
  id: string;
  businessName: string;
  tenantId: string;
  packageName: string;
  subscribedAt: string;
  paidAmount: number;
  billingCycle: string;
  expiresAt: string;
  status: string;
};

type TableRow = Subscription & Record<string, unknown>;

export const Route = createFileRoute("/platform/subscriptions")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") {
      throw redirect({ to: "/platform/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Subscriptions — Platform" }],
  }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { data: subscriptions = [] } = useTenantSubscriptions();

  const rows = useMemo<TableRow[]>(
    () => (subscriptions as Subscription[]).map((s) => ({ ...s })),
    [subscriptions],
  );

  const palette = useMemo(
    () => ({
      textMuted: theme.palette.text.secondary,
    }),
    [theme],
  );

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        key: "businessName",
        label: "Business",
        width: 220,
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
              {row.businessName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: palette.textMuted, fontSize: 11.5, mt: 0.25 }}
            >
              {row.tenantId}
            </Typography>
          </Box>
        ),
      },
      { key: "packageName", label: "Package", width: 160 },
      {
        key: "subscribedAt",
        label: "Subscribed",
        width: 130,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatDate(row.subscribedAt)}
          </Typography>
        ),
      },
      {
        key: "paidAmount",
        label: "Paid amount",
        width: 130,
        align: "right",
        render: (row) => (
          <Typography
            variant="body2"
            sx={{ fontSize: 13, fontWeight: 500 }}
          >
            {row.paidAmount ? formatCurrency(row.paidAmount) : "Trial"}
          </Typography>
        ),
      },
      {
        key: "billingCycle",
        label: "Billing",
        width: 110,
        render: (row) => (
          <Typography
            variant="body2"
            sx={{
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {row.billingCycle}
          </Typography>
        ),
      },
      {
        key: "expiresAt",
        label: "Expires",
        width: 130,
        render: (row) => (
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {formatDate(row.expiresAt)}
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
    [theme.palette.primary.main, palette.textMuted],
  );

  return (
    <PlatformShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <UniversalTable<TableRow>
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          rowsPerPage={10}
          showSrNo={false}
          tableSize="medium"

          header={{
            title: "Subscriptions",
            subtitle:
              "Review tenant subscription plans, payments and renewal dates.",
            countLabel: (n) => `${n} subscriptions`,
          }}

          search={{
            enabled: true,
            placeholder: "Search business, package or tenant ID",
            highlightColor: isDark ? "#facc15" : "#ffeb3b",
          }}

          export={{
            enabled: true,
            mode: "all",
            filename: "subscriptions",
            showExcel: true,
            showCSV: true,
            showPDF: true,
            showPrint: true,
            showCopy: false,
            showWord: false,
          }}

          mode={{ type: "client" }}

          emptyState={{
            message: "No subscriptions yet",
            description:
              "Subscriptions appear here once tenants start subscribing to packages.",
            icon: (
              <CreditCard
                size={48}
                style={{ color: palette.textMuted, opacity: 0.5 }}
              />
            ),
          }}

          styles={{ paper: { borderRadius: 2 } }}
        />

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
          <CreditCard size={16} />
          Payment reconciliation will connect to the backend billing provider
          later.
        </Box>
      </motion.div>
    </PlatformShell>
  );
}
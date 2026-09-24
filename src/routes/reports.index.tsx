import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { BarChart3, Download } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { useMetrics, useSalesSeries } from "@/hooks/queries/dashboard";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [{ title: "Reports — BizUno" }],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { data: metrics = [] } = useMetrics("year");
  const { data: series = [] } = useSalesSeries();

  const max = Math.max(...series.map((point) => point.sales), 1);

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Understand sales performance, profitability and cash flow at a glance."
        crumbs={[{ label: "Home", to: "/" }, { label: "Reports" }]}
        actions={
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={() => window.print()}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
            }}
          >
            Export report
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {metrics.slice(0, 4).map((metric) => (
            <Grid key={metric.key} size={{ xs: 12, sm: 6, xl: 3 }}>
              <MuiCard
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  height: "100%",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    boxShadow: isDark
                      ? `0 4px 12px ${alpha(theme.palette.common.black, 0.4)}`
                      : `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.5,
                      fontSize: 24,
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      lineHeight: 1.2,
                    }}
                  >
                    {formatCurrency(metric.value)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.75,
                      display: "block",
                      color:
                        metric.change >= 0
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                      fontWeight: 600,
                    }}
                  >
                    {metric.change >= 0 ? "+" : ""}
                    {metric.change}% vs previous period
                  </Typography>
                </CardContent>
              </MuiCard>
            </Grid>
          ))}
        </Grid>

        <MuiCard
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 3 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <BarChart3 size={18} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                  Sales trend
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Monthly sales performance for the current year
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              {series.map((point) => {
                const pct = (point.sales / max) * 100;
                return (
                  <Box
                    key={point.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2.5rem 1fr 8rem",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {point.label}
                    </Typography>

                    <Box
                      sx={{
                        position: "relative",
                        height: 24,
                        borderRadius: 1.5,
                        bgcolor: alpha(
                          theme.palette.primary.main,
                          isDark ? 0.08 : 0.06,
                        ),
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${pct}%`,
                          borderRadius: 1.5,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
                            theme.palette.primary.main,
                            0.7,
                          )})`,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: 13,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {formatCurrency(point.sales, { compact: true })}
                    </Typography>
                  </Box>
                );
              })}

              {series.length === 0 && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    No sales data available for this period.
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </MuiCard>
      </motion.div>
    </AppShell>
  );
}
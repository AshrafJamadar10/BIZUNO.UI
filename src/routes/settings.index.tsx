import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [{ title: "Settings — BizUno" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [company, setCompany] = useState("Nexus Traders Pvt Ltd");
  const [email, setEmail] = useState("accounts@nexustraders.in");
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    toast.success("Settings saved");
  };

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Configure your workspace, company details and notifications."
        crumbs={[{ label: "Home", to: "/" }, { label: "Settings" }]}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: theme.palette.text.primary,
                  }}
                >
                  Company profile
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, color: theme.palette.text.secondary }}
                >
                  These details appear on invoices and reports.
                </Typography>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Company name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Accounts email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Currency"
                      value="INR (₹)"
                      fullWidth
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Financial year"
                      value="April - March"
                      fullWidth
                      size="small"
                      disabled
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={handleSave}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: theme.palette.primary.main,
                      "&:hover": { bgcolor: theme.palette.primary.dark },
                    }}
                  >
                    Save changes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: theme.palette.text.primary,
                  }}
                >
                  Notifications
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, color: theme.palette.text.secondary }}
                >
                  Choose which workspace alerts you receive.
                </Typography>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      isDark ? 0.08 : 0.03,
                    ),
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                          }}
                        >
                          Email notifications
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Low stock and payment reminders
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: "flex-start", m: 0 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </AppShell>
  );
}
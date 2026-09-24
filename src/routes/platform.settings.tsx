import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Save } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import TextInputField from "@/components/MUI/TextInputField";
import EmailField from "@/components/MUI/EmailField";
import NumericField from "@/components/MUI/NumericField";

export const Route = createFileRoute("/platform/settings")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") {
      throw redirect({ to: "/platform/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Platform Settings — BizUno" }],
  }),
  component: PlatformSettingsPage,
});

type SettingsForm = {
  name: string;
  supportEmail: string;
  defaultTrial: string;
};

function PlatformSettingsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const methods = useForm<SettingsForm>({
    defaultValues: {
      name: "BizUno Platform",
      supportEmail: "support@bizuno.local",
      defaultTrial: "14",
    },
  });

  const values = methods.watch();

  const handleSubmit = methods.handleSubmit(() => {
    toast.success("Platform settings saved");
  });

  return (
    <PlatformShell>
      <PageHeader
        title="Platform settings"
        description="Configure platform identity, support contact and tenant defaults."
        crumbs={[{ label: "Platform", to: "/platform" }, { label: "Settings" }]}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <MuiCard
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit} noValidate>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Platform configuration
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      These settings apply across all tenant workspaces.
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextInputField
                          name="name"
                          label="Platform name"
                          inputType="alphabet"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <EmailField
                          name="supportEmail"
                          label="Support email"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <NumericField
                          name="defaultTrial"
                          label="Default trial period (days)"
                          min={0}
                          max={3650}
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextInputField
                          name="currency"
                          label="Default currency"
                          inputType="all"
                          value="INR (₹)"
                          disabled
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save size={16} />}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          bgcolor: theme.palette.primary.main,
                          "&:hover": {
                            bgcolor: theme.palette.primary.dark,
                          },
                        }}
                      >
                        Save changes
                      </Button>
                    </Box>
                  </form>
                </FormProvider>
              </CardContent>
            </MuiCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <MuiCard
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
                  Tenant provisioning
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, color: theme.palette.text.secondary }}
                >
                  New workspaces currently use frontend demo data. Backend
                  provisioning can be connected later.
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
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      fontSize: 11,
                    }}
                  >
                    Current default
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.75,
                      fontWeight: 600,
                      fontSize: 14,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {values.defaultTrial || "14"}-day trial ·{" "}
                    {values.name || "BizUno Platform"}
                  </Typography>
                </Box>
              </CardContent>
            </MuiCard>
          </Grid>
        </Grid>
      </motion.div>
    </PlatformShell>
  );
}
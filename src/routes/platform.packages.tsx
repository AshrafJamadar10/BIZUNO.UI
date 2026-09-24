import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Check, Pencil, Plus, Package } from "lucide-react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import {
  FieldRenderer,
  evaluateCalculation,
  evaluateCondition,
  loadFormConfig,
  useBreakpoint,
  type FormConfig,
} from "@/utils/FormHandling/FormEngine";
import {
  useCreatePackage,
  useSubscriptionPackages,
  useUpdatePackage,
} from "@/hooks/queries/platform";
import { formatCurrency, formatNumber } from "@/utils/format";

type SubscriptionPackage = {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  userLimit: number;
  activeTenants: number;
  features: string[];
  status: string;
};

export const Route = createFileRoute("/platform/packages")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") {
      throw redirect({ to: "/platform/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Subscription Packages — BizUno" }],
  }),
  component: PackagesPage,
});

const NUMERIC_KEYS = new Set([
  "monthlyPrice",
  "annualPrice",
  "userLimit",
]);

function PackagesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const breakpoint = useBreakpoint();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormConfig>({ fields: [] });

  const methods = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const { reset, handleSubmit, formState, control, setValue, getValues } =
    methods;

  const { data: packages = [] } = useSubscriptionPackages();
  const create = useCreatePackage();
  const update = useUpdatePackage();

  useEffect(() => {
    const loaded = loadFormConfig("platform_package");
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
    (
      pkg: SubscriptionPackage,
    ): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      for (const f of orderedFields) {
        const raw = (pkg as unknown as Record<string, unknown>)[f.name];
        out[f.name] =
          raw === undefined || raw === null ? f.defaultValue ?? "" : raw;
      }
      return out;
    },
    [orderedFields],
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

  const openEdit = useCallback(
    (pkg: SubscriptionPackage) => {
      setEditingId(pkg.id);
      reset(buildValuesFromRow(pkg));
      setOpen(true);
    },
    [reset, buildValuesFromRow],
  );

  const openCreate = useCallback(() => {
    setEditingId(null);
    reset(buildEmptyValues());
    setOpen(true);
  }, [reset, buildEmptyValues]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    reset(buildEmptyValues());
  }, [reset, buildEmptyValues]);

  const submitForm = handleSubmit((values) => {
    const raw = { ...(values as Record<string, unknown>) };

    for (const key of Object.keys(raw)) {
      if (NUMERIC_KEYS.has(key)) {
        const n = Number(raw[key]);
        if (!Number.isNaN(n)) raw[key] = n;
      }
    }

    const onSuccess = () => {
      toast.success(editingId ? "Package updated" : "Package created");
      setOpen(false);
      setEditingId(null);
      reset(buildEmptyValues());
    };

    const onError = (error: Error) => toast.error(error.message);

    if (editingId) {
      update.mutate(
        { id: editingId, input: raw as never },
        { onSuccess, onError },
      );
    } else {
      create.mutate(raw as never, { onSuccess, onError });
    }
  });

  const totalCount = packages.length;

  return (
    <PlatformShell>
      <PageHeader
        title="Subscription packages"
        description="Configure plans, pricing, limits and feature access."
        crumbs={[
          { label: "Platform", to: "/platform" },
          { label: "Packages" },
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={openCreate}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            }}
          >
            New package
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={2.5}>
          {packages.map((pkg) => (
            <Grid key={pkg.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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
                      ? `0 4px 16px ${alpha(
                          theme.palette.common.black,
                          0.4,
                        )}`
                      : `0 4px 16px ${alpha(
                          theme.palette.common.black,
                          0.06,
                        )}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          lineHeight: 1.3,
                        }}
                      >
                        {pkg.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          color: theme.palette.text.secondary,
                          fontSize: 12.5,
                        }}
                      >
                        {pkg.activeTenants} active tenants
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.25,
                          borderRadius: 999,
                          bgcolor: alpha(
                            theme.palette.success.main,
                            isDark ? 0.15 : 0.1,
                          ),
                          color: theme.palette.success.main,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      >
                        {pkg.status}
                      </Box>
                      <Button
                        size="small"
                        onClick={() => openEdit(pkg)}
                        aria-label={`Edit ${pkg.name}`}
                        sx={{
                          minWidth: 32,
                          p: 0.75,
                          color: theme.palette.text.secondary,
                          borderRadius: 1,
                          "&:hover": {
                            color: theme.palette.primary.main,
                            bgcolor: alpha(
                              theme.palette.primary.main,
                              0.08,
                            ),
                          },
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography
                      sx={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        lineHeight: 1.1,
                      }}
                    >
                      {formatCurrency(pkg.monthlyPrice)}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                          ml: 0.5,
                        }}
                      >
                        / month
                      </Typography>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.75,
                        color: theme.palette.text.secondary,
                        fontSize: 12,
                      }}
                    >
                      {formatCurrency(pkg.annualPrice)} billed annually · up to{" "}
                      {formatNumber(pkg.userLimit)} users
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: 2.5,
                      pt: 2.5,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      component="ul"
                      sx={{
                        listStyle: "none",
                        p: 0,
                        m: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {pkg.features.map((feature) => (
                        <Box
                          component="li"
                          key={feature}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontSize: 13,
                            color: theme.palette.text.primary,
                          }}
                        >
                          <Check
                            size={16}
                            style={{
                              color: theme.palette.success.main,
                              flexShrink: 0,
                            }}
                          />
                          {feature}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </MuiCard>
            </Grid>
          ))}

          {totalCount === 0 && (
            <Grid size={{ xs: 12 }}>
              <MuiCard
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  p: 6,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Package
                    size={48}
                    style={{
                      color: palette.textMuted,
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: theme.palette.text.primary,
                    }}
                  >
                    No packages yet
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      maxWidth: 380,
                    }}
                  >
                    Create your first subscription package to offer to
                    businesses.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Plus size={14} />}
                    onClick={openCreate}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: theme.palette.primary.main,
                      "&:hover": {
                        bgcolor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Create package
                  </Button>
                </Box>
              </MuiCard>
            </Grid>
          )}
        </Grid>
      </motion.div>

      <Dialog
        open={open}
        onClose={handleClose}
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
          {editingId ? "Edit package" : "Create package"}
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
                      (form key: <code>platform_package</code>).
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleClose}
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
                Save changes
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>
    </PlatformShell>
  );
}
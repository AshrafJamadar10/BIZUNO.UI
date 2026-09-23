import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
} from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from 'react-hook-form';

import {
  DEFAULT_SCREEN_COLORS_DARK,
  DEFAULT_SCREEN_COLORS_LIGHT,
  DEFAULT_SCREEN_STYLE,
  FieldRenderer,
  evaluateCalculation,
  evaluateCondition,
  loadFormConfig,
  useBreakpoint,
  type FormConfig,
  type FormScreenColors,
} from '@/utils/FormEngine';

const WebsiteForm: FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const breakpoint = useBreakpoint();

  const [config, setConfig] = useState<FormConfig>({ fields: [] });
  const [submitted, setSubmitted] = useState<Record<string, string> | null>(null);

  const methods = useForm<FieldValues>({
    mode: 'onSubmit',
    shouldUnregister: false,
  });

  const { control, setValue, getValues, handleSubmit, reset } = methods;

  useEffect(() => {
    const loaded = loadFormConfig();
    setConfig(loaded);
    const initial: Record<string, string> = {};
    loaded.fields.forEach((f) => {
      initial[f.name] = f.defaultValue ?? '';
    });
    reset(initial);
  }, [reset]);

  const orderedFields = useMemo(
    () => [...config.fields].sort((a, b) => a.order - b.order),
    [config.fields],
  );

  const watchedValues = useWatch({ control }) as
    | Record<string, string>
    | undefined;
  const currentValues = watchedValues ?? {};

  const visibleFields = useMemo(
    () =>
      orderedFields.filter((f) => evaluateCondition(f.condition, currentValues)),
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

  const onSubmit = useCallback(
    (data: FieldValues) => {
      const payload: Record<string, string> = {};
      for (const field of visibleFields) {
        if (field.type === 'heading' || field.type === 'divider') continue;
        const raw = data[field.name];
        payload[field.label] =
          raw === undefined || raw === null ? '' : String(raw);
      }
      setSubmitted(payload);
    },
    [visibleFields],
  );

  const screen = config.screen ?? DEFAULT_SCREEN_STYLE;

  const palette = useMemo(() => {
    const t = theme.palette;

    /* Read the mode-specific color set, falling back to theme defaults */
    const modeColors: FormScreenColors =
      (isDark ? screen.colors?.dark : screen.colors?.light) ??
      (isDark ? DEFAULT_SCREEN_COLORS_DARK : DEFAULT_SCREEN_COLORS_LIGHT);

    const pick = (override: string | undefined, fallback: string): string =>
      override && override.trim() !== '' ? override.trim() : fallback;

    return {
      pageBg: pick(modeColors.pageBgColor, t.background.default),
      cardBg: pick(modeColors.cardBgColor, t.background.paper),
      cardBorder: t.divider,
      cardShadow: isDark
        ? `0 8px 32px ${alpha(t.common.black, 0.5)}`
        : `0 4px 24px ${alpha(t.common.black, 0.06)}`,
      titleColor: pick(modeColors.titleColor, t.text.primary),
      subtitleColor: pick(modeColors.subtitleColor, t.text.secondary),
      dividerColor: t.divider,
      dialogBg: t.background.paper,
      dialogBorder: t.divider,
      dialogTitle: t.text.primary,
      dialogText: t.text.secondary,
      dialogValue: t.text.primary,
      rowHover: isDark
        ? alpha(t.common.white, 0.04)
        : alpha(t.common.black, 0.03),
      successIcon: t.success.main,
      closeIcon: t.text.secondary,
      emptyValue: alpha(t.text.primary, isDark ? 0.35 : 0.4),
      submitBg: pick(modeColors.submitBgColor, t.primary.main),
      submitText: pick(modeColors.submitTextColor, t.primary.contrastText),
    };
  }, [theme, isDark, screen]);

  return (
    <Box
      sx={{
        py: { xs: 2.5, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2 },
        minHeight: '100%',
        bgcolor: palette.pageBg,
        transition: 'background-color 0.2s ease',
      }}
    >
      <Container maxWidth={screen.cardMaxWidth ?? 'md'} disableGutters>
        <Card
          elevation={0}
          sx={{
            bgcolor: palette.cardBg,
            borderRadius: `${screen.cardBorderRadius ?? 12}px`,
            border: `1px solid ${palette.cardBorder}`,
            boxShadow: palette.cardShadow,
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          }}
        >
          <CardContent
            sx={{
              p: { xs: 2.5, sm: `${screen.cardPadding ?? 32}px` },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
                lineHeight: 1.25,
                color: palette.titleColor,
                wordBreak: 'break-word',
                letterSpacing: '-0.015em',
              }}
            >
              {screen.titleText ?? 'Dynamic Form'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: palette.subtitleColor,
                lineHeight: 1.6,
              }}
            >
              {screen.subtitleText ?? ''}
            </Typography>

            <FormProvider {...methods}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' },
                    gap: `${screen.fieldGap ?? 16}px`,
                  }}
                >
                  {visibleFields.map((field) => {
                    const layout = field.layout[breakpoint];
                    return (
                      <Box
                        key={field.id}
                        sx={{
                          gridColumn: {
                            xs: 'span 1',
                            sm: `span ${layout.colSpan}`,
                          },
                          minWidth: 0,
                        }}
                      >
                        <FieldRenderer field={field} />
                      </Box>
                    );
                  })}
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    pt: 3,
                    mt: 1,
                    borderTop: `1px solid ${palette.dividerColor}`,
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disableElevation
                    sx={{
                      bgcolor: palette.submitBg,
                      color: palette.submitText,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                      borderRadius: 2,
                      py: 1.25,
                      boxShadow: 'none',
                      transition:
                        'background-color 0.15s ease, transform 0.15s ease',
                      '&:hover': {
                        bgcolor: palette.submitBg,
                        filter: isDark
                          ? 'brightness(1.1)'
                          : 'brightness(0.95)',
                        boxShadow: 'none',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }}
                  >
                    {screen.submitLabel ?? 'Submit'}
                  </Button>
                </Stack>
              </Box>
            </FormProvider>
          </CardContent>
        </Card>
      </Container>

      <Dialog
        open={submitted !== null}
        onClose={() => setSubmitted(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              bgcolor: palette.dialogBg,
              border: `1px solid ${palette.dialogBorder}`,
              backgroundImage: 'none',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 700,
            fontSize: 17,
            color: palette.dialogTitle,
            borderBottom: `1px solid ${palette.dialogBorder}`,
            pb: 1.75,
          }}
        >
          <CheckCircleIcon sx={{ color: palette.successIcon, fontSize: 22 }} />
          Submitted Data
          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={() => setSubmitted(null)}
              sx={{ ml: 'auto', color: palette.closeIcon }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {submitted && Object.keys(submitted).length > 0 && (
            <Stack
              spacing={0}
              divider={
                <Divider sx={{ borderColor: palette.dividerColor }} />
              }
            >
              {Object.entries(submitted).map(([key, value]) => (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                    py: 1.5,
                    px: 1,
                    borderRadius: 1,
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: palette.rowHover },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: palette.dialogText,
                      fontWeight: 500,
                      minWidth: 120,
                      flex: '0 0 auto',
                    }}
                  >
                    {key}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: value
                        ? palette.dialogValue
                        : palette.emptyValue,
                      fontWeight: value ? 600 : 500,
                      textAlign: 'right',
                      wordBreak: 'break-word',
                      flex: '1 1 auto',
                      minWidth: 0,
                    }}
                  >
                    {value || '—'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {submitted && Object.keys(submitted).length === 0 && (
            <Typography
              variant="body2"
              sx={{
                color: palette.dialogText,
                textAlign: 'center',
                py: 4,
              }}
            >
              No fields were submitted.
            </Typography>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 2,
            borderTop: `1px solid ${palette.dialogBorder}`,
          }}
        >
          <Button
            onClick={() => setSubmitted(null)}
            variant="contained"
            disableElevation
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: palette.submitBg,
              color: palette.submitText,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: palette.submitBg,
                filter: isDark ? 'brightness(1.1)' : 'brightness(0.95)',
                boxShadow: 'none',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebsiteForm;
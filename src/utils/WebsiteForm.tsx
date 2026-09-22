import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import {
  Box, Button, Card, CardContent, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, Typography,
} from '@mui/material';
import { FormProvider, useForm, useWatch, type FieldValues } from 'react-hook-form';

import {
  DEFAULT_SCREEN_STYLE,
  FieldRenderer,
  evaluateCalculation,
  evaluateCondition,
  loadFormConfig,
  useBreakpoint,
  type FormConfig,
} from '@/utils/FormEngine';

const WebsiteForm: FC = () => {
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

  const watchedValues = useWatch({ control }) as Record<string, string> | undefined;
  const currentValues = watchedValues ?? {};

  const visibleFields = useMemo(
    () => orderedFields.filter((f) => evaluateCondition(f.condition, currentValues)),
    [orderedFields, currentValues],
  );

  useEffect(() => {
    for (const field of orderedFields) {
      if (!field.calculation.enabled) continue;
      const computed = evaluateCalculation(field.calculation, currentValues);
      const existing = getValues(field.name);
      if (existing !== computed) {
        setValue(field.name, computed, { shouldValidate: false, shouldDirty: false });
      }
    }
  }, [orderedFields, currentValues, getValues, setValue]);

  const onSubmit = useCallback(
    (data: FieldValues) => {
      const payload: Record<string, string> = {};
      for (const field of visibleFields) {
        if (field.type === 'heading' || field.type === 'divider') continue;
        const raw = data[field.name];
        payload[field.label] = raw === undefined || raw === null ? '' : String(raw);
      }
      setSubmitted(payload);
    },
    [visibleFields],
  );

  const screen = config.screen ?? DEFAULT_SCREEN_STYLE;

  return (
    <Box
      sx={{
        py: { xs: 2.5, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2 },
        minHeight: '100%',
        bgcolor: screen.pageBgColor || 'background.default',
      }}
    >
      <Container maxWidth={screen.cardMaxWidth ?? 'md'} disableGutters>
        <Card
          elevation={screen.cardShadow ?? 3}
          sx={{
            bgcolor: screen.cardBgColor || 'background.paper',
            borderRadius: `${screen.cardBorderRadius ?? 12}px`,
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
                color: screen.titleColor || 'text.primary',
                wordBreak: 'break-word',
              }}
            >
              {screen.titleText ?? 'Dynamic Form'}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 3, color: screen.subtitleColor || 'text.secondary' }}
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
                          gridColumn: { xs: 'span 1', sm: `span ${layout.colSpan}` },
                        }}
                      >
                        <FieldRenderer field={field} />
                      </Box>
                    );
                  })}
                </Box>

                <Stack direction="row" spacing={2} sx={{ pt: 3 }}>
                  <Button
                    type="submit" variant="contained" fullWidth
                    sx={{
                      ...(screen.submitBgColor && { bgcolor: screen.submitBgColor }),
                      ...(screen.submitTextColor && { color: screen.submitTextColor }),
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

      <Dialog open={submitted !== null} onClose={() => setSubmitted(null)} fullWidth maxWidth="sm">
        <DialogTitle>Submitted Data</DialogTitle>
        <DialogContent dividers>
          {submitted && (
            <Stack spacing={1}>
              {Object.entries(submitted).map(([key, value]) => (
                <Box
                  key={key}
                  sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}
                >
                  <Typography variant="body2" color="text.secondary">{key}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                    {value || '—'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitted(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebsiteForm;
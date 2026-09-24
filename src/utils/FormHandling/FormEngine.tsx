import { memo, useEffect, useState, type FC } from 'react';
import { Box, Checkbox, Divider, FormControlLabel, Typography } from '@mui/material';
import { Controller, useFormContext, type FieldValues } from 'react-hook-form';

import TextInputField from '@/components/MUI/TextInputField';
import EmailField from '@/components/MUI/EmailField';
import MobileField from '@/components/MUI/MobileField';
import AadhaarCardField from '@/components/MUI/AadhaarCardField';
import SearchField from '@/components/MUI/SearchField';
import PasswordField from '@/components/MUI/PasswordField';
import NumericField from '@/components/MUI/NumericField';
import DropdownField from '@/components/MUI/DropdownField';
import RadioField from '@/components/MUI/RadioField';
import CheckboxGroup from '@/components/MUI/CheckboxGroup';
import DateTimeField from '@/components/MUI/DateTimeField';
import FileUpload from '@/components/MUI/FileUpload';
import PhotoUpload from '@/components/MUI/PhotoUpload';

export type FieldType =
  | 'text' | 'number' | 'email' | 'mobile' | 'aadhaar' | 'search'
  | 'password' | 'textarea' | 'select' | 'multiselect' | 'radio'
  | 'checkbox' | 'checkboxGroup' | 'date' | 'time' | 'datetime'
  | 'file' | 'photo' | 'heading' | 'divider';

export type ConditionOperator =
  | 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'
  | 'contains' | 'isEmpty' | 'isNotEmpty';

export type ColSpan = 1 | 2 | 3 | 4 | 6 | 12;
export type FieldVariant = 'outlined' | 'filled' | 'standard';
export type FieldSize = 'small' | 'medium';
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface FieldCondition {
  fieldName: string;
  operator: ConditionOperator;
  value: string;
}

export interface FieldCalculation {
  enabled: boolean;
  expression: string;
  dependsOn: string[];
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface FieldLayout {
  colSpan: ColSpan;
  variant: FieldVariant;
  size: FieldSize;
}

export type ResponsiveFieldLayout = Record<Breakpoint, FieldLayout>;

export interface FieldStyleOverrides {
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  fontWeight?: number;
  padding?: number;
  shadow?: 0 | 1 | 2 | 3 | 4;
}

export interface FileFieldOptions {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

export interface FieldConfig {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  helper?: string;
  type: FieldType;
  required: boolean;
  defaultValue: string;
  options: string[];
  optionLabels?: Record<string, string>;
  validation: FieldValidation;
  condition: FieldCondition | null;
  calculation: FieldCalculation;
  order: number;
  layout: ResponsiveFieldLayout;
  style: FieldStyleOverrides;
  fileOptions?: FileFieldOptions;
  props?: Record<string, string | number | boolean>;
  system?: boolean;
}

export interface FormScreenColors {
  pageBgColor?: string;
  cardBgColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  submitBgColor?: string;
  submitTextColor?: string;
}

export interface FormScreenStyle {
  cardMaxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  cardBorderRadius?: number;
  cardPadding?: number;
  cardShadow?: 0 | 1 | 2 | 3 | 4;
  titleText?: string;
  subtitleText?: string;
  fieldGap?: number;
  submitLabel?: string;
  loginLabel?: string;
  colors?: {
    light?: FormScreenColors;
    dark?: FormScreenColors;
  };
  pageBgColor?: string;
  cardBgColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  submitBgColor?: string;
  submitTextColor?: string;
}

export interface FormConfig {
  fields: FieldConfig[];
  screen?: FormScreenStyle;
}

export const FORM_CONFIG_KEY_PREFIX = 'bizuno_form_config__';
export const FORM_CONFIG_KEY_LEGACY = 'bizuno_form_config';

export const PLACEHOLDER_EXAMPLES: Record<FieldType, string> = {
  text: 'Enter your name',
  number: '12345',
  email: 'you@example.com',
  mobile: '+91 98765 43210',
  aadhaar: '1234 5678 9012',
  search: 'Search…',
  password: 'At least 8 characters',
  textarea: 'Write your message here…',
  select: 'Choose one…',
  radio: 'Pick one option',
  checkbox: 'I agree to the terms',
  checkboxGroup: 'Select all that apply',
  multiselect: 'Select one or more',
  date: 'YYYY-MM-DD',
  time: 'HH:MM',
  datetime: 'YYYY-MM-DD HH:MM',
  file: 'Upload a document',
  photo: 'Upload a photo',
  heading: 'Section title',
  divider: '',
};

export const OPTIONS_EXAMPLES: Partial<Record<FieldType, string>> = {
  select: 'Red|Red Color\nGreen|Green Color\nBlue|Blue Color',
  radio: 'Male|Male\nFemale|Female\nOther|Other',
  checkboxGroup: 'Read\nWrite\nSpeak',
  multiselect: 'India\nUSA\nUK',
};

export const DEFAULT_LAYOUT: FieldLayout = {
  colSpan: 6,
  variant: 'outlined',
  size: 'small',
};

export const DEFAULT_RESPONSIVE_LAYOUT: ResponsiveFieldLayout = {
  mobile: { ...DEFAULT_LAYOUT, colSpan: 12 },
  tablet: { ...DEFAULT_LAYOUT, colSpan: 6 },
  desktop: { ...DEFAULT_LAYOUT, colSpan: 6 },
};

export const DEFAULT_SCREEN_COLORS_LIGHT: FormScreenColors = {
  pageBgColor: '#f8fafc',
  cardBgColor: '#ffffff',
  titleColor: '#0f172a',
  subtitleColor: '#64748b',
  submitBgColor: '#2563eb',
  submitTextColor: '#ffffff',
};

export const DEFAULT_SCREEN_COLORS_DARK: FormScreenColors = {
  pageBgColor: '#0f172a',
  cardBgColor: '#111827',
  titleColor: '#f8fafc',
  subtitleColor: '#94a3b8',
  submitBgColor: '#3b82f6',
  submitTextColor: '#ffffff',
};

export const DEFAULT_SCREEN_STYLE: FormScreenStyle = {
  cardMaxWidth: 'md',
  cardBorderRadius: 12,
  cardPadding: 32,
  cardShadow: 3,
  titleText: 'Dynamic Form',
  subtitleText: 'Fields are managed from the Form Handling tab.',
  fieldGap: 16,
  submitLabel: 'Submit',
  loginLabel: 'Login',
  colors: {
    light: DEFAULT_SCREEN_COLORS_LIGHT,
    dark: DEFAULT_SCREEN_COLORS_DARK,
  },
};

export function formStorageKey(formKey: string): string {
  return `${FORM_CONFIG_KEY_PREFIX}${formKey}`;
}

export function newFieldId(): string {
  return `fld_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

export interface ParsedOptions {
  values: string[];
  labels: Record<string, string>;
}

export function parseOptions(text: string): ParsedOptions {
  const values: string[] = [];
  const labels: Record<string, string> = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [valuePart, labelPart] = line.split('|');
    const value = (valuePart ?? '').trim();
    if (!value) continue;
    values.push(value);
    const label = (labelPart ?? '').trim();
    if (label && label !== value) labels[value] = label;
  }
  return { values, labels };
}

export function serializeOptions(field: FieldConfig): string {
  return field.options
    .map((value) => {
      const label = field.optionLabels?.[value];
      return label && label !== value ? `${value}|${label}` : value;
    })
    .join('\n');
}

export function evaluateCondition(
  condition: FieldCondition | null,
  values: Record<string, string>,
): boolean {
  if (!condition || !condition.fieldName) return true;
  const left = (values[condition.fieldName] ?? '').toString();
  const right = condition.value ?? '';

  switch (condition.operator) {
    case 'equals': return left === right;
    case 'notEquals': return left !== right;
    case 'greaterThan': return Number(left) > Number(right);
    case 'lessThan': return Number(left) < Number(right);
    case 'contains': return left.toLowerCase().includes(right.toLowerCase());
    case 'isEmpty': return left.trim() === '';
    case 'isNotEmpty': return left.trim() !== '';
    default: return true;
  }
}

const CALC_ALLOWED = /^[\s0-9+\-*/().{}a-zA-Z_]+$/;

export function evaluateCalculation(
  calc: FieldCalculation,
  values: Record<string, string>,
): string {
  if (!calc.enabled || !calc.expression.trim()) return '';
  if (!CALC_ALLOWED.test(calc.expression)) return '';

  let substituted = calc.expression;
  for (const dep of calc.dependsOn) {
    const raw = values[dep] ?? '0';
    const numeric = Number(raw);
    const safe = Number.isFinite(numeric) ? String(numeric) : '0';
    substituted = substituted.split(`{${dep}}`).join(safe);
  }
  if (/[{}a-zA-Z_]/.test(substituted)) return '';

  try {
    const result = Function(`"use strict"; return (${substituted});`)() as unknown;
    if (typeof result === 'number' && Number.isFinite(result)) {
      return String(Math.round(result * 100) / 100);
    }
    return '';
  } catch {
    return '';
  }
}

function evaluateCalculationSafe(
  calc: FieldCalculation,
  values: Record<string, string>,
  visibility: Record<string, boolean>,
): string {
  if (!calc.enabled || !calc.expression.trim()) return '';
  if (!CALC_ALLOWED.test(calc.expression)) return '';

  let substituted = calc.expression;
  for (const dep of calc.dependsOn) {
    const visible = visibility[dep] ?? true;
    const raw = visible ? (values[dep] ?? '0') : '0';
    const numeric = Number(raw);
    const safe = Number.isFinite(numeric) ? String(numeric) : '0';
    substituted = substituted.split(`{${dep}}`).join(safe);
  }
  if (/[{}a-zA-Z_]/.test(substituted)) return '';

  try {
    const result = Function(`"use strict"; return (${substituted});`)() as unknown;
    if (typeof result === 'number' && Number.isFinite(result)) {
      return String(Math.round(result * 100) / 100);
    }
    return '';
  } catch {
    return '';
  }
}

export function extractDependencies(expression: string): string[] {
  const matches = expression.match(/\{([a-zA-Z0-9_]+)\}/g) ?? [];
  return matches.map((m) => m.slice(1, -1));
}

export function buildDependencyGraph(fields: FieldConfig[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const f of fields) {
    const deps = new Set<string>();
    if (f.condition?.fieldName) deps.add(f.condition.fieldName);
    for (const dep of f.calculation.dependsOn ?? []) deps.add(dep);
    graph.set(f.name, deps);
  }
  return graph;
}

export function topoSort(
  fields: FieldConfig[],
): { order: FieldConfig[]; cycles: string[] } {
  const graph = buildDependencyGraph(fields);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: FieldConfig[] = [];
  const cycles: string[] = [];
  const byName = new Map(fields.map((f) => [f.name, f]));

  const visit = (name: string) => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      cycles.push(name);
      return;
    }
    visiting.add(name);
    const deps = graph.get(name) ?? new Set<string>();
    for (const dep of deps) {
      if (byName.has(dep)) visit(dep);
    }
    visiting.delete(name);
    visited.add(name);
    const field = byName.get(name);
    if (field) result.push(field);
  };

  for (const f of fields) visit(f.name);
  return { order: result, cycles };
}

export interface ResolvedForm {
  values: Record<string, string>;
  visibility: Record<string, boolean>;
  errors: string[];
}

export function resolveForm(
  schema: FormConfig,
  rawInputs: Record<string, unknown>,
): ResolvedForm {
  const { order, cycles } = topoSort(schema.fields);
  const errors: string[] = [];
  if (cycles.length) {
    errors.push(`Circular dependency detected: ${cycles.join(', ')}`);
  }

  const values: Record<string, string> = {};
  const visibility: Record<string, boolean> = {};

  for (const f of schema.fields) {
    const raw = rawInputs[f.name];
    values[f.name] =
      raw === undefined || raw === null ? f.defaultValue ?? '' : String(raw);
  }

  for (const field of order) {
    const visible = field.condition
      ? evaluateCondition(field.condition, values)
      : true;
    visibility[field.name] = visible;

    if (field.calculation.enabled && visible) {
      values[field.name] = evaluateCalculationSafe(
        field.calculation,
        values,
        visibility,
      );
    } else if (!visible) {
      values[field.name] = '0';
    }
  }

  return { values, visibility, errors };
}

export function isCalculated(field: FieldConfig): boolean {
  return field.calculation.enabled;
}

export function normalizeField(field: Partial<FieldConfig>, index: number): FieldConfig {
  let layout: ResponsiveFieldLayout;
  if (field.layout && 'mobile' in field.layout) {
    layout = field.layout as ResponsiveFieldLayout;
  } else if (field.layout) {
    const old = field.layout as unknown as FieldLayout;
    layout = {
      mobile: { ...old, colSpan: 12 },
      tablet: { ...old },
      desktop: { ...old },
    };
  } else {
    layout = DEFAULT_RESPONSIVE_LAYOUT;
  }

  return {
    id: field.id ?? newFieldId(),
    name: field.name ?? `field_${index}`,
    label: field.label ?? `Field ${index + 1}`,
    placeholder: field.placeholder ?? '',
    helper: field.helper,
    type: field.type ?? 'text',
    required: field.required ?? false,
    defaultValue: field.defaultValue ?? '',
    options: Array.isArray(field.options) ? field.options : [],
    optionLabels: field.optionLabels,
    validation: field.validation ?? {},
    condition: field.condition ?? null,
    calculation: field.calculation ?? {
      enabled: false,
      expression: '',
      dependsOn: [],
    },
    order: typeof field.order === 'number' ? field.order : index,
    layout,
    style: field.style ?? {},
    fileOptions: field.fileOptions,
    props: field.props ?? {},
    system: field.system,
  };
}

function migrateScreen(
  incoming: Partial<FormScreenStyle> | undefined,
): FormScreenStyle {
  if (!incoming) return DEFAULT_SCREEN_STYLE;

  if (incoming.colors) {
    const lightIn = incoming.colors.light ?? {};
    const darkIn = incoming.colors.dark ?? {};

    return {
      ...DEFAULT_SCREEN_STYLE,
      ...incoming,
      colors: {
        light: {
          ...DEFAULT_SCREEN_COLORS_LIGHT,
          ...(lightIn.pageBgColor ? { pageBgColor: lightIn.pageBgColor } : {}),
          ...(lightIn.cardBgColor ? { cardBgColor: lightIn.cardBgColor } : {}),
          ...(lightIn.titleColor ? { titleColor: lightIn.titleColor } : {}),
          ...(lightIn.subtitleColor ? { subtitleColor: lightIn.subtitleColor } : {}),
          ...(lightIn.submitBgColor ? { submitBgColor: lightIn.submitBgColor } : {}),
          ...(lightIn.submitTextColor ? { submitTextColor: lightIn.submitTextColor } : {}),
        },
        dark: {
          ...DEFAULT_SCREEN_COLORS_DARK,
          ...(darkIn.pageBgColor ? { pageBgColor: darkIn.pageBgColor } : {}),
          ...(darkIn.cardBgColor ? { cardBgColor: darkIn.cardBgColor } : {}),
          ...(darkIn.titleColor ? { titleColor: darkIn.titleColor } : {}),
          ...(darkIn.subtitleColor ? { subtitleColor: darkIn.subtitleColor } : {}),
          ...(darkIn.submitBgColor ? { submitBgColor: darkIn.submitBgColor } : {}),
          ...(darkIn.submitTextColor ? { submitTextColor: darkIn.submitTextColor } : {}),
        },
      },
    };
  }

  const legacyLight: FormScreenColors = {};
  if (incoming.pageBgColor) legacyLight.pageBgColor = incoming.pageBgColor;
  if (incoming.cardBgColor) legacyLight.cardBgColor = incoming.cardBgColor;
  if (incoming.titleColor) legacyLight.titleColor = incoming.titleColor;
  if (incoming.subtitleColor) legacyLight.subtitleColor = incoming.subtitleColor;
  if (incoming.submitBgColor) legacyLight.submitBgColor = incoming.submitBgColor;
  if (incoming.submitTextColor) legacyLight.submitTextColor = incoming.submitTextColor;

  return {
    ...DEFAULT_SCREEN_STYLE,
    ...incoming,
    colors: {
      light: { ...DEFAULT_SCREEN_COLORS_LIGHT, ...legacyLight },
      dark: { ...DEFAULT_SCREEN_COLORS_DARK },
    },
  };
}

export interface LoadOptions {
  fallbackFields?: FieldConfig[];
  fallbackScreen?: FormScreenStyle;
}

export function loadFormConfig(
  formKey: string = 'default',
  options: LoadOptions = {},
): FormConfig {
  const fallbackFields = options.fallbackFields ?? [];
  const fallbackScreen = options.fallbackScreen ?? DEFAULT_SCREEN_STYLE;

  try {
    const key = formStorageKey(formKey);
    let raw = window.localStorage.getItem(key);

    if (!raw && formKey === 'default') {
      raw = window.localStorage.getItem(FORM_CONFIG_KEY_LEGACY);
    }

    if (!raw) {
      const seeded: FormConfig = {
        fields: fallbackFields,
        screen: fallbackScreen,
      };
      window.localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw) as Partial<FormConfig>;
    if (!Array.isArray(parsed.fields) || parsed.fields.length === 0) {
      return { fields: fallbackFields, screen: fallbackScreen };
    }
    return {
      fields: parsed.fields.map((f, i) => normalizeField(f, i)),
      screen: migrateScreen(parsed.screen),
    };
  } catch {
    return { fields: fallbackFields, screen: fallbackScreen };
  }
}

export function saveFormConfig(
  config: FormConfig,
  formKey: string = 'default',
): void {
  try {
    window.localStorage.setItem(formStorageKey(formKey), JSON.stringify(config));
  } catch {
    /* storage full or unavailable */
  }
}

export function resetFormConfig(formKey: string = 'default'): void {
  try {
    window.localStorage.removeItem(formStorageKey(formKey));
  } catch {
    /* ignore */
  }
}

const MOBILE_MAX = 599;
const TABLET_MAX = 899;

function computeBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= MOBILE_MAX) return 'mobile';
  if (w <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => computeBreakpoint());

  useEffect(() => {
    const onChange = () => setBp(computeBreakpoint());
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
  }, []);

  return bp;
}

const SingleCheckbox: FC<{ name: string; label: string; disabled?: boolean }> = ({
  name,
  label,
  disabled,
}) => {
  const { control } = useFormContext<FieldValues>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(field.value)}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={label}
        />
      )}
    />
  );
};

export interface FieldRendererProps {
  field: FieldConfig;
  previewMode?: boolean;
}

export const FieldRenderer: FC<FieldRendererProps> = memo(
  ({ field, previewMode = false }) => {
    const wrapperSx = previewMode ? { pointerEvents: 'none' as const } : {};
    const extraProps = field.props ?? {};
    const isCalc = field.calculation.enabled;
    const locked = previewMode || isCalc;

    if (field.type === 'heading') {
      return (
        <Box sx={wrapperSx}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {field.label}
          </Typography>
          {field.helper && (
            <Typography variant="caption" color="text.secondary">
              {field.helper}
            </Typography>
          )}
        </Box>
      );
    }

    if (field.type === 'divider') {
      return (
        <Divider
          sx={(t) => ({
            my: 1,
            borderColor:
              t.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(15, 23, 42, 0.22)',
          })}
        />
      );
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <TextInputField
            name={field.name}
            label={field.label}
            required={field.required}
            placeholder={field.placeholder}
            inputType={field.type === 'textarea' ? 'textarea' : 'all'}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'email':
        return (
          <EmailField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'mobile':
        return (
          <MobileField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'aadhaar':
        return (
          <AadhaarCardField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'search':
        return (
          <SearchField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'password':
        return (
          <PasswordField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'number':
        return (
          <NumericField
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'select':
      case 'multiselect':
        return (
          <DropdownField
            name={field.name}
            label={field.label}
            required={field.required}
            options={field.options.map((o) => ({
              value: o,
              label: field.optionLabels?.[o] ?? o,
            }))}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'radio':
        return (
          <RadioField
            name={field.name}
            label={field.label}
            required={field.required}
            options={field.options.map((o) => ({
              value: o,
              label: field.optionLabels?.[o] ?? o,
            }))}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'checkboxGroup':
        return (
          <CheckboxGroup
            name={field.name}
            label={field.label}
            required={field.required}
            options={field.options.map((o) => ({
              value: o,
              label: field.optionLabels?.[o] ?? o,
            }))}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'date':
      case 'time':
      case 'datetime':
        return (
          <DateTimeField
            name={field.name}
            label={field.label}
            required={field.required}
            viewMode={field.type}
            size={field.layout.desktop.size}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'file':
        return (
          <FileUpload
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'photo':
        return (
          <PhotoUpload
            name={field.name}
            label={field.label}
            required={field.required}
            disabled={locked}
            sx={wrapperSx}
            {...extraProps}
          />
        );

      case 'checkbox':
        return (
          <SingleCheckbox
            name={field.name}
            label={field.label}
            disabled={locked}
          />
        );

      default:
        return null;
    }
  },
);

FieldRenderer.displayName = 'FieldRenderer';


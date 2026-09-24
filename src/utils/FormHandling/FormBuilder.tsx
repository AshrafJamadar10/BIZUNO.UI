import { useEffect, useMemo, useState, type FC } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Checkbox, Chip, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import NotesIcon from '@mui/icons-material/Notes';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import BadgeIcon from '@mui/icons-material/Badge';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import NumbersIcon from '@mui/icons-material/Numbers';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import TitleIcon from '@mui/icons-material/Title';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import WidthFullIcon from '@mui/icons-material/WidthFull';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormProvider, useForm } from 'react-hook-form';

import { ColorFieldUncontrolled } from '@/components/MUI/ColorPicker';
import {
  DEFAULT_RESPONSIVE_LAYOUT,
  DEFAULT_SCREEN_COLORS_LIGHT,
  DEFAULT_SCREEN_COLORS_DARK,
  DEFAULT_SCREEN_STYLE,
  FieldRenderer,
  OPTIONS_EXAMPLES,
  PLACEHOLDER_EXAMPLES,
  extractDependencies,
  loadFormConfig,
  newFieldId,
  parseOptions,
  saveFormConfig,
  serializeOptions,
  slugify,
  topoSort,
  type Breakpoint,
  type ColSpan,
  type ConditionOperator,
  type FieldConfig,
  type FieldLayout,
  type FieldSize,
  type FieldType,
  type FieldVariant,
  type FormConfig,
  type FormScreenColors,
  type FormScreenStyle,
} from '@/utils/FormHandling/FormEngine';
import {
  FORM_REGISTRY,
  getFormEntry,
} from '@/utils/FormHandling/FormRegistry';
import {
  FIELD_TYPE_SCHEMAS,
  FIELD_TYPE_SCHEMA_MAP,
  defaultPropsFor,
  type PropSchema,
} from '@/utils/FormHandling/FieldTypeRegistry';

const FIELD_ICON_MAP: Record<FieldType, SvgIconComponent> = {
  text: TextFieldsIcon,
  textarea: NotesIcon,
  email: EmailIcon,
  mobile: PhoneIphoneIcon,
  aadhaar: BadgeIcon,
  search: SearchIcon,
  password: LockIcon,
  number: NumbersIcon,
  select: ArrowDropDownCircleIcon,
  multiselect: ChecklistIcon,
  radio: RadioButtonCheckedIcon,
  checkbox: CheckBoxIcon,
  checkboxGroup: ChecklistRtlIcon,
  date: CalendarTodayIcon,
  time: AccessTimeIcon,
  datetime: ScheduleIcon,
  file: AttachFileIcon,
  photo: ImageIcon,
  heading: TitleIcon,
  divider: HorizontalRuleIcon,
};

const SDivider = ({ children }: { children?: React.ReactNode }) => (
  <Divider
    sx={(t) => ({
      borderColor:
        t.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(15, 23, 42, 0.22)',
      color: 'text.secondary',
      '&::before, &::after': {
        borderColor:
          t.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(15, 23, 42, 0.22)',
      },
      '& .MuiDivider-wrapper': { color: 'text.secondary' },
    })}
  >
    {children}
  </Divider>
);

const getFieldIcon = (type: FieldType): SvgIconComponent =>
  FIELD_ICON_MAP[type] ?? TextFieldsIcon;

const CONDITION_OPERATORS: ConditionOperator[] = [
  'equals', 'notEquals', 'greaterThan', 'lessThan', 'contains', 'isEmpty', 'isNotEmpty',
];

const COL_SPANS: ColSpan[] = [12, 6, 4, 3, 2, 1];
const VARIANTS: FieldVariant[] = ['outlined', 'filled', 'standard'];
const SIZES: FieldSize[] = ['small', 'medium'];

const PREVIEW_VIEWPORT: Record<Breakpoint, number | '100%'> = {
  mobile: 375, tablet: 768, desktop: '100%',
};

const COL_LABELS: { value: ColSpan; label: string }[] = [
  { value: 12, label: 'Full (12/12)' },
  { value: 6, label: 'Half (6/12)' },
  { value: 4, label: 'One-third (4/12)' },
  { value: 3, label: 'Quarter (3/12)' },
  { value: 2, label: 'Small (2/12)' },
  { value: 1, label: 'Tiny (1/12)' },
];

type BuilderTab = 'fields' | 'responsive' | 'appearance';
type ColorMode = 'light' | 'dark';

const TAB_META: { value: BuilderTab; label: string; icon: SvgIconComponent }[] = [
  { value: 'fields', label: 'Fields', icon: DashboardCustomizeIcon },
  { value: 'responsive', label: 'Responsive', icon: DevicesOtherIcon },
  { value: 'appearance', label: 'Appearance', icon: PaletteIcon },
];

interface FieldDraft {
  label: string; name: string; placeholder: string; helper: string;
  type: FieldType; required: boolean; defaultValue: string; optionsText: string;
  minLength: string; maxLength: string; pattern: string; min: string; max: string;
  conditionField: string; conditionOperator: ConditionOperator; conditionValue: string;
  calcEnabled: boolean; calcExpression: string;
  colSpan: ColSpan; variant: FieldVariant; size: FieldSize;
  textColor: string; backgroundColor: string; borderColor: string;
  borderRadius: string; fontWeight: string;
  componentProps: Record<string, string | number | boolean>;
}

const EMPTY_DRAFT: FieldDraft = {
  label: '', name: '', placeholder: '', helper: '', type: 'text', required: false,
  defaultValue: '', optionsText: '', minLength: '', maxLength: '', pattern: '',
  min: '', max: '', conditionField: '', conditionOperator: 'equals', conditionValue: '',
  calcEnabled: false, calcExpression: '', colSpan: 6, variant: 'outlined', size: 'small',
  textColor: '', backgroundColor: '', borderColor: '', borderRadius: '', fontWeight: '',
  componentProps: {},
};

const draftFromField = (field: FieldConfig): FieldDraft => ({
  label: field.label, name: field.name, placeholder: field.placeholder,
  helper: field.helper ?? '', type: field.type, required: field.required,
  defaultValue: field.defaultValue, optionsText: serializeOptions(field),
  minLength: field.validation.minLength?.toString() ?? '',
  maxLength: field.validation.maxLength?.toString() ?? '',
  pattern: field.validation.pattern ?? '',
  min: field.validation.min?.toString() ?? '',
  max: field.validation.max?.toString() ?? '',
  conditionField: field.condition?.fieldName ?? '',
  conditionOperator: field.condition?.operator ?? 'equals',
  conditionValue: field.condition?.value ?? '',
  calcEnabled: field.calculation.enabled,
  calcExpression: field.calculation.expression,
  colSpan: field.layout.desktop.colSpan,
  variant: field.layout.desktop.variant,
  size: field.layout.desktop.size,
  textColor: field.style.textColor ?? '',
  backgroundColor: field.style.backgroundColor ?? '',
  borderColor: field.style.borderColor ?? '',
  borderRadius: field.style.borderRadius?.toString() ?? '',
  fontWeight: field.style.fontWeight?.toString() ?? '',
  componentProps: field.props ?? defaultPropsFor(field.type),
});

const draftToFieldConfig = (draft: FieldDraft, id: string): FieldConfig => {
  const usesOptions = ['select', 'multiselect', 'radio', 'checkboxGroup'].includes(draft.type);
  const parsed = usesOptions
    ? parseOptions(draft.optionsText)
    : { values: [], labels: {} as Record<string, string> };

  return {
    id,
    name: draft.name || 'preview',
    label: draft.label || 'Untitled',
    placeholder: draft.placeholder,
    helper: draft.helper,
    type: draft.type,
    required: draft.required,
    defaultValue: draft.defaultValue,
    options: parsed.values,
    optionLabels: Object.keys(parsed.labels).length ? parsed.labels : undefined,
    validation: {},
    condition: null,
    calculation: { enabled: false, expression: '', dependsOn: [] },
    order: 0,
    layout: {
      mobile: { colSpan: 12, variant: draft.variant, size: draft.size },
      tablet: { colSpan: draft.colSpan, variant: draft.variant, size: draft.size },
      desktop: { colSpan: draft.colSpan, variant: draft.variant, size: draft.size },
    },
    style: {
      ...(draft.textColor && { textColor: draft.textColor }),
      ...(draft.backgroundColor && { backgroundColor: draft.backgroundColor }),
      ...(draft.borderColor && { borderColor: draft.borderColor }),
      ...(draft.borderRadius && { borderRadius: Number(draft.borderRadius) }),
      ...(draft.fontWeight && { fontWeight: Number(draft.fontWeight) }),
    },
    props: draft.componentProps,
  };
};

const PreviewField: FC<{ field: FieldConfig }> = ({ field }) => {
  const methods = useForm({
    defaultValues: { [field.name]: field.defaultValue ?? '' },
  });
  return (
    <FormProvider {...methods}>
      <FieldRenderer field={field} previewMode />
    </FormProvider>
  );
};

interface SubmitFieldPreviewProps {
  screen: FormScreenStyle;
  colorMode: ColorMode;
}

const SubmitFieldPreview: FC<SubmitFieldPreviewProps> = ({ screen, colorMode }) => {
  const modeColors =
    (colorMode === 'dark' ? screen.colors?.dark : screen.colors?.light) ?? {};

  const bg = modeColors.submitBgColor || (colorMode === 'dark' ? '#3b82f6' : '#2563eb');
  const fg = modeColors.submitTextColor || '#ffffff';
  const label = screen.submitLabel || 'Submit';

  return (
    <Box
      sx={{
        gridColumn: { xs: 'span 12', sm: 'span 12' },
        position: 'relative',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: 1.5,
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'absolute', top: 6, left: 6, alignItems: 'center',
          bgcolor: 'background.paper', border: '1px solid',
          borderColor: 'divider', borderRadius: 1,
          px: 0.75, py: 0.25, zIndex: 2,
        }}
      >
        <SaveIcon fontSize="inherit" sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
          Submit button
        </Typography>
      </Stack>

      <Box sx={{ pt: 5 }}>
        <Button
          fullWidth
          disableElevation
          sx={{
            bgcolor: bg, color: fg, textTransform: 'none', fontWeight: 600,
            borderRadius: 2, py: 1.25, boxShadow: 'none', pointerEvents: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {label}
        </Button>
      </Box>
    </Box>
  );
};

interface SortableFieldProps {
  field: FieldConfig;
  breakpoint: Breakpoint;
  layout: FieldLayout;
  onWidthChange: (colSpan: ColSpan) => void;
}

const SortableField: FC<SortableFieldProps> = ({
  field, breakpoint, layout, onWidthChange,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const Icon = getFieldIcon(field.type);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const effectiveSpan = breakpoint === 'mobile' ? 12 : layout.colSpan;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        gridColumn: { xs: 'span 12', sm: `span ${effectiveSpan}` },
        position: 'relative',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        bgcolor: 'background.paper',
        p: 1.5,
        minWidth: 0,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: isDragging ? 4 : 0,
        '&:hover': { borderColor: 'primary.light' },
        '&:hover .field-actions': { opacity: 1 },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          position: 'absolute', top: 6, left: 6, cursor: 'grab',
          color: 'text.secondary', bgcolor: 'background.paper',
          border: '1px solid', borderColor: 'divider',
          borderRadius: 1, p: 0.25, display: 'flex', alignItems: 'center',
          zIndex: 2, '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'absolute', top: 6, left: 42, alignItems: 'center',
          bgcolor: 'background.paper', border: '1px solid',
          borderColor: 'divider', borderRadius: 1,
          px: 0.75, py: 0.25, zIndex: 2,
        }}
      >
        <Icon fontSize="inherit" sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
          {field.label || field.type}
        </Typography>
      </Stack>

      {breakpoint !== 'mobile' && (
        <Box
          className="field-actions"
          sx={{
            position: 'absolute', top: 6, right: 6, zIndex: 2,
            opacity: 0.9, transition: 'opacity 0.15s',
          }}
        >
          <TextField
            select
            size="small"
            value={layout.colSpan}
            onChange={(e) => onWidthChange(Number(e.target.value) as ColSpan)}
            slotProps={{
              input: {
                startAdornment: (
                  <WidthFullIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                ),
              },
            }}
            sx={{ minWidth: 150, '& .MuiInputBase-input': { fontSize: 12, py: 0.5 } }}
          >
            {COL_LABELS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      <Box sx={{ pt: 5 }}>
        <PreviewField field={field} />
      </Box>
    </Box>
  );
};

interface ResponsiveDesignerProps {
  fields: FieldConfig[];
  screen: FormScreenStyle;
  colorMode: ColorMode;
  onSave: (next: FieldConfig[]) => void;
}

const ResponsiveDesigner: FC<ResponsiveDesignerProps> = ({
  fields, onSave, colorMode, screen,
}) => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [draft, setDraft] = useState<FieldConfig[]>(fields);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fieldsKey = useMemo(() => fields.map((f) => f.id).join(','), [fields]);
  const [lastKey, setLastKey] = useState(fieldsKey);
  if (fieldsKey !== lastKey) {
    setLastKey(fieldsKey);
    setDraft(fields);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const sorted = useMemo(
    () => [...draft].sort((a, b) => a.order - b.order),
    [draft],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((f) => f.id === active.id);
    const newIndex = sorted.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setDraft(arrayMove(sorted, oldIndex, newIndex).map((f, i) => ({ ...f, order: i })));
  };

  const patchWidth = (id: string, colSpan: ColSpan) => {
    setDraft((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const cur = f.layout[breakpoint] ?? DEFAULT_RESPONSIVE_LAYOUT[breakpoint];
        return { ...f, layout: { ...f.layout, [breakpoint]: { ...cur, colSpan } } };
      }),
    );
  };

  const containerWidth = PREVIEW_VIEWPORT[breakpoint];

  return (
    <Box className="rise-in">
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (t) =>
            `linear-gradient(135deg, ${t.palette.primary.main}11, ${t.palette.secondary.main}11)`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <DevicesOtherIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Responsive Layout
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Drag the handle to reorder. Use the width dropdown to resize per device.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <ToggleButtonGroup
            exclusive
            size="small"
            value={breakpoint}
            onChange={(_e, v: Breakpoint | null) => { if (v) setBreakpoint(v); }}
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="mobile">
              <SmartphoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Mobile
            </ToggleButton>
            <ToggleButton value="tablet">
              <TabletMacIcon fontSize="small" sx={{ mr: 0.5 }} /> Tablet
            </ToggleButton>
            <ToggleButton value="desktop">
              <LaptopMacIcon fontSize="small" sx={{ mr: 0.5 }} /> Desktop
            </ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={() => setDraft(fields)}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => onSave(sorted.map((f, i) => ({ ...f, order: i })))}
            >
              Save Layout
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Alert severity="info" icon={<SmartphoneIcon />} sx={{ mb: 2, borderRadius: 2 }}>
        On <strong>Mobile</strong> everything is full width by default. Use Tablet & Desktop
        to place fields side-by-side.
      </Alert>

      <Box
        sx={{
          mx: 'auto',
          width: containerWidth,
          maxWidth: '100%',
          p: 3,
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'grey.900' : 'grey.100'),
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            size="small"
            icon={<DevicesOtherIcon fontSize="small" />}
            label={typeof containerWidth === 'number' ? `${containerWidth}px viewport` : 'Fluid viewport'}
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<DashboardCustomizeIcon fontSize="small" />}
            label={`${sorted.length} field${sorted.length === 1 ? '' : 's'}`}
            color="primary"
            variant="outlined"
          />
        </Stack>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((f) => f.id)} strategy={rectSortingStrategy}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
              {sorted.map((field) => {
                const layout = field.layout[breakpoint] ?? DEFAULT_RESPONSIVE_LAYOUT[breakpoint];
                return (
                  <SortableField
                    key={field.id}
                    field={field}
                    breakpoint={breakpoint}
                    layout={layout}
                    onWidthChange={(span) => patchWidth(field.id, span)}
                  />
                );
              })}
              <SubmitFieldPreview screen={screen} colorMode={colorMode} />
            </Box>
          </SortableContext>
        </DndContext>

        {sorted.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No fields yet. Add some from the Fields tab first.
          </Alert>
        )}
      </Box>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <VisibilityIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Preview — all devices
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {(['mobile', 'tablet', 'desktop'] as Breakpoint[]).map((bp) => {
              const BpIcon =
                bp === 'mobile' ? SmartphoneIcon :
                bp === 'tablet' ? TabletMacIcon : LaptopMacIcon;
              return (
                <Box key={bp} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                    <BpIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', fontWeight: 700 }}>
                      {bp}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      bgcolor: 'background.paper',
                      overflow: 'auto',
                      maxHeight: '70vh',
                    }}
                  >
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1 }}>
                      {sorted.map((field) => {
                        const layout = field.layout[bp] ?? DEFAULT_RESPONSIVE_LAYOUT[bp];
                        const span = bp === 'mobile' ? 12 : layout.colSpan;
                        return (
                          <Box key={field.id} sx={{ gridColumn: `span ${span}` }}>
                            <PreviewField field={field} />
                          </Box>
                        );
                      })}

                      <Box
                        sx={{
                          gridColumn: 'span 12',
                          mt: 1,
                          pt: 1.5,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Button
                          fullWidth
                          disableElevation
                          sx={{
                            bgcolor:
                              (colorMode === 'dark'
                                ? screen.colors?.dark?.submitBgColor
                                : screen.colors?.light?.submitBgColor) ||
                              (colorMode === 'dark' ? '#3b82f6' : '#2563eb'),
                            color:
                              (colorMode === 'dark'
                                ? screen.colors?.dark?.submitTextColor
                                : screen.colors?.light?.submitTextColor) || '#ffffff',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            py: 1.25,
                            boxShadow: 'none',
                            pointerEvents: 'none',
                            fontSize: bp === 'mobile' ? 13 : 14,
                          }}
                        >
                          {screen.submitLabel || 'Submit'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface FormPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (formKey: string) => void;
  currentFormKey: string | null;
}

const FormPickerDialog: FC<FormPickerDialogProps> = ({
  open, onClose, onSelect, currentFormKey,
}) => {
  const sortedForms = useMemo(
    () => [...FORM_REGISTRY].sort((a, b) => a.order - b.order),
    [],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <DashboardCustomizeIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Select a form to manage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Choose which tab&apos;s form you want to customize.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {sortedForms.map((form) => {
            const active = form.formKey === currentFormKey;
            return (
              <Card
                key={form.formKey}
                variant="outlined"
                onClick={() => onSelect(form.formKey)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderRadius: 2,
                  borderColor: active ? 'primary.main' : 'divider',
                  borderWidth: active ? 2 : 1,
                  bgcolor: active ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: (t) => `${t.palette.primary.main}18`,
                        color: 'primary.main',
                        width: 36,
                        height: 36,
                      }}
                    >
                      <DashboardCustomizeIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {form.label}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {form.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      fontFamily: 'monospace',
                      color: 'text.disabled',
                    }}
                  >
                    key: {form.formKey}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FormBuilder: FC = () => {
  const [activeFormKey, setActiveFormKey] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);

  const [config, setConfig] = useState<FormConfig>({ fields: [] });
  const [tab, setTab] = useState<BuilderTab>('fields');
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<'pick' | 'config'>('pick');
  const [draft, setDraft] = useState<FieldDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [screenDraft, setScreenDraft] = useState<FormScreenStyle>(DEFAULT_SCREEN_STYLE);
  const [screenDirty, setScreenDirty] = useState(false);

  useEffect(() => {
    if (!activeFormKey) return;
    const entry = getFormEntry(activeFormKey);
    const loaded = loadFormConfig(activeFormKey, {
      fallbackFields: entry?.defaultFields?.length ? entry.defaultFields : [],
      fallbackScreen: DEFAULT_SCREEN_STYLE,
    });
    setConfig(loaded);
    setScreenDraft(loaded.screen ?? DEFAULT_SCREEN_STYLE);
    setScreenDirty(false);
  }, [activeFormKey]);

  const handleSelectForm = (formKey: string) => {
    setActiveFormKey(formKey);
    setPickerOpen(false);
    setTab('fields');
  };

  const handleSwitchForm = () => {
    setPickerOpen(true);
  };

  const orderedFields = useMemo(
    () => [...config.fields].sort((a, b) => a.order - b.order),
    [config.fields],
  );

  const otherFields = useMemo(
    () => orderedFields.filter((f) => !f.calculation.enabled && f.name !== draft.name),
    [orderedFields, draft.name],
  );

  const currentColors: FormScreenColors = useMemo(() => {
    const set =
      colorMode === 'dark' ? screenDraft.colors?.dark : screenDraft.colors?.light;
    const defaults =
      colorMode === 'dark' ? DEFAULT_SCREEN_COLORS_DARK : DEFAULT_SCREEN_COLORS_LIGHT;

    return {
      pageBgColor: set?.pageBgColor || defaults.pageBgColor,
      cardBgColor: set?.cardBgColor || defaults.cardBgColor,
      titleColor: set?.titleColor || defaults.titleColor,
      subtitleColor: set?.subtitleColor || defaults.subtitleColor,
      submitBgColor: set?.submitBgColor || defaults.submitBgColor,
      submitTextColor: set?.submitTextColor || defaults.submitTextColor,
    };
  }, [screenDraft, colorMode]);

  const setCurrentColor = (key: keyof FormScreenColors, value: string) => {
    setScreenDraft((s) => ({
      ...s,
      colors: {
        light: s.colors?.light ?? DEFAULT_SCREEN_COLORS_LIGHT,
        dark: s.colors?.dark ?? DEFAULT_SCREEN_COLORS_DARK,
        [colorMode]: {
          ...(s.colors?.[colorMode] ??
            (colorMode === 'dark' ? DEFAULT_SCREEN_COLORS_DARK : DEFAULT_SCREEN_COLORS_LIGHT)),
          [key]: value,
        },
      },
    }));
    setScreenDirty(true);
  };

  const resetCurrentMode = () => {
    setScreenDraft((s) => ({
      ...s,
      colors: {
        light: s.colors?.light ?? DEFAULT_SCREEN_COLORS_LIGHT,
        dark: s.colors?.dark ?? DEFAULT_SCREEN_COLORS_DARK,
        [colorMode]:
          colorMode === 'dark' ? DEFAULT_SCREEN_COLORS_DARK : DEFAULT_SCREEN_COLORS_LIGHT,
      },
    }));
    setScreenDirty(true);
  };

  const persist = (next: FormConfig) => {
    if (!activeFormKey) return;
    setConfig(next);
    saveFormConfig(next, activeFormKey);
  };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setError('');
    setStep('pick');
  };

  const openAdd = () => {
    resetDraft();
    setDialogOpen(true);
  };

  const openEdit = (field: FieldConfig) => {
    setDraft(draftFromField(field));
    setEditingId(field.id);
    setError('');
    setStep('config');
    setDialogOpen(true);
  };

  const handlePickType = (type: FieldType) => {
    setDraft((d) => ({
      ...d,
      type,
      placeholder: d.placeholder || PLACEHOLDER_EXAMPLES[type],
      optionsText: d.optionsText || OPTIONS_EXAMPLES[type] || '',
      componentProps: defaultPropsFor(type),
    }));
    setStep('config');
  };

  const validateDraft = (candidate?: FieldConfig): string | null => {
    const schema = FIELD_TYPE_SCHEMA_MAP[draft.type];
    const needsName = schema?.component !== '—' && draft.type !== 'checkbox';

    if (draft.type !== 'divider' && !draft.label.trim()) return 'Label is required';

    if (needsName) {
      if (!draft.name.trim()) return 'Field name is required';
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(draft.name)) {
        return 'Field name must be letters, digits, underscore (start with a letter)';
      }
      const clash = orderedFields.some((f) => f.name === draft.name && f.id !== editingId);
      if (clash) return 'A field with this name already exists';
    }

    if (['select', 'multiselect', 'radio', 'checkboxGroup'].includes(draft.type)) {
      const parsed = parseOptions(draft.optionsText);
      if (parsed.values.length === 0) return 'At least one option is required';
    }

    if (draft.calcEnabled) {
      if (!draft.calcExpression.trim()) return 'Calculation expression is required';
      const deps = extractDependencies(draft.calcExpression);
      if (deps.length === 0) {
        return 'Calculation must reference at least one field using {field_name}';
      }
      for (const dep of deps) {
        if (!orderedFields.some((f) => f.name === dep) && dep !== draft.name) {
          return `Calculation references unknown field: ${dep}`;
        }
      }
      if (draft.required) {
        return 'A calculated field cannot be required (it is read-only)';
      }
    }

    if (candidate) {
      const proposed = editingId
        ? orderedFields.map((f) => (f.id === editingId ? candidate : f))
        : [...orderedFields, candidate];
      const { cycles } = topoSort(proposed);
      if (cycles.length) {
        return `Circular dependency detected involving: ${cycles.join(', ')}`;
      }
    }

    return null;
  };

  const buildField = (): FieldConfig => {
    const deps = draft.calcEnabled ? extractDependencies(draft.calcExpression) : [];
    const parsed = ['select', 'multiselect', 'radio', 'checkboxGroup'].includes(draft.type)
      ? parseOptions(draft.optionsText)
      : { values: [], labels: {} as Record<string, string> };

    const isFileType = draft.type === 'file' || draft.type === 'photo';
    const baseLayout: FieldLayout = {
      colSpan: draft.colSpan, variant: draft.variant, size: draft.size,
    };

    return {
      id: editingId ?? newFieldId(),
      name: draft.type === 'heading' || draft.type === 'divider'
        ? `_static_${Date.now()}`
        : draft.name,
      label: draft.label,
      placeholder: draft.placeholder,
      helper: draft.helper || undefined,
      type: draft.type,
      required: draft.calcEnabled ? false : draft.required,
      defaultValue: draft.defaultValue,
      options: parsed.values,
      optionLabels: Object.keys(parsed.labels).length ? parsed.labels : undefined,
      validation: {
        ...(draft.minLength !== '' && { minLength: Number(draft.minLength) }),
        ...(draft.maxLength !== '' && { maxLength: Number(draft.maxLength) }),
        ...(draft.pattern !== '' && { pattern: draft.pattern }),
        ...(draft.min !== '' && { min: Number(draft.min) }),
        ...(draft.max !== '' && { max: Number(draft.max) }),
      },
      condition: draft.conditionField
        ? {
            fieldName: draft.conditionField,
            operator: draft.conditionOperator,
            value: draft.conditionValue,
          }
        : null,
      calculation: {
        enabled: draft.calcEnabled,
        expression: draft.calcEnabled ? draft.calcExpression : '',
        dependsOn: deps,
      },
      order: editingId
        ? orderedFields.find((f) => f.id === editingId)?.order ?? orderedFields.length
        : orderedFields.length,
      layout: {
        mobile: { ...baseLayout, colSpan: 12 },
        tablet: { ...baseLayout },
        desktop: { ...baseLayout },
      },
      style: {
        ...(draft.textColor && { textColor: draft.textColor }),
        ...(draft.backgroundColor && { backgroundColor: draft.backgroundColor }),
        ...(draft.borderColor && { borderColor: draft.borderColor }),
        ...(draft.borderRadius !== '' && { borderRadius: Number(draft.borderRadius) }),
        ...(draft.fontWeight !== '' && { fontWeight: Number(draft.fontWeight) }),
      },
      ...(isFileType && {
        fileOptions: {
          accept:
            typeof draft.componentProps.accept === 'string'
              ? draft.componentProps.accept
              : undefined,
          maxSizeMB:
            typeof draft.componentProps.maxSizeMB === 'number'
              ? draft.componentProps.maxSizeMB
              : undefined,
          multiple: false,
        },
      }),
      props: { ...draft.componentProps },
    };
  };

  const handleSaveDraft = () => {
    const built = buildField();
    const validationError = validateDraft(built);
    if (validationError) {
      setError(validationError);
      return;
    }
    const next: FormConfig = editingId
      ? { ...config, fields: config.fields.map((f) => (f.id === editingId ? built : f)) }
      : { ...config, fields: [...config.fields, built] };
    persist(next);
    setDialogOpen(false);
    resetDraft();
  };

  const handleDeleteField = (id: string) => {
    persist({
      ...config,
      fields: config.fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })),
    });
  };

  const handleSaveScreen = () => {
    persist({ ...config, screen: screenDraft });
    setScreenDirty(false);
  };

  const schema = FIELD_TYPE_SCHEMA_MAP[draft.type];
  const usesOptions = ['select', 'multiselect', 'radio', 'checkboxGroup'].includes(draft.type);
  const isFileType = draft.type === 'file' || draft.type === 'photo';

  const setProp = (key: string, value: string | number | boolean) => {
    setDraft((d) => ({ ...d, componentProps: { ...d.componentProps, [key]: value } }));
  };

  const activeEntry = activeFormKey ? getFormEntry(activeFormKey) : null;

  if (!activeFormKey) {
    return (
      <FormPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectForm}
        currentFormKey={activeFormKey}
      />
    );
  }

  return (
    <Box className="page-enter" sx={{ pb: { xs: 4, md: 6 } }}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
        <Box
          className="surface-panel rise-in"
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 3,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -80,
              right: -80,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: (t) =>
                `radial-gradient(circle, ${t.palette.primary.main}22 0%, transparent 70%)`,
              pointerEvents: 'none',
            },
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', mb: 2.5, position: 'relative', zIndex: 1 }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: { xs: 44, md: 52 },
                height: { xs: 44, md: 52 },
                boxShadow: 3,
              }}
            >
              <DashboardCustomizeIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                Form Handling
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.25 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Editing:
                </Typography>
                <Chip size="small" color="primary" label={activeEntry?.label ?? activeFormKey} />
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', color: 'text.disabled' }}
                >
                  ({activeFormKey})
                </Typography>
              </Stack>
            </Box>
            <Button
              onClick={handleSwitchForm}
              startIcon={<SwapHorizIcon />}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              Switch form
            </Button>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Button
              onClick={openAdd}
              startIcon={<AddIcon />}
              disableElevation
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                height: 44,
                minWidth: 160,
                bgcolor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 0,
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.light',
                  color: 'primary.main',
                  transform: 'translateY(-1px)',
                  boxShadow: 1,
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 0,
                },
              }}
            >
              Add New Field
            </Button>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {TAB_META.map((item) => {
                const TabIcon = item.icon;
                const active = tab === item.value;
                return (
                  <Button
                    key={item.value}
                    onClick={() => setTab(item.value)}
                    startIcon={<TabIcon />}
                    disableElevation
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2.5,
                      height: 44,
                      minWidth: 130,
                      bgcolor: active ? 'primary.main' : 'background.paper',
                      color: active ? 'primary.contrastText' : 'text.primary',
                      border: '1px solid',
                      borderColor: active ? 'primary.main' : 'divider',
                      boxShadow: active ? 2 : 0,
                      '&:hover': {
                        bgcolor: active
                          ? (t) =>
                              t.palette.mode === 'dark'
                                ? t.palette.primary.light
                                : t.palette.primary.dark
                          : 'action.hover',
                        borderColor: active ? 'primary.main' : 'primary.light',
                        color: active ? 'primary.contrastText' : 'primary.main',
                        transform: 'translateY(-1px)',
                        boxShadow: active ? 3 : 1,
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                        boxShadow: active ? 1 : 0,
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          </Stack>
        </Box>

        {tab === 'fields' && (
          <Card className="rise-in" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <DashboardCustomizeIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Current Fields
                  </Typography>
                  <Chip size="small" label={orderedFields.length} color="primary" />
                </Stack>
              </Stack>

              <Stack spacing={1.5}>
                {orderedFields.map((field) => {
                  const FieldIcon = getFieldIcon(field.type);
                  return (
                    <Card
                      key={field.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        transition:
                          'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ py: 1.5 }}>
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: 'center', minWidth: 0 }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: (t) => `${t.palette.primary.main}18`,
                                color: 'primary.main',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <FieldIcon fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 700 }}
                                >
                                  #{field.order + 1} ·{' '}
                                  {field.label || `(${field.type})`}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={
                                    FIELD_TYPE_SCHEMA_MAP[field.type]?.title ??
                                    field.type
                                  }
                                />
                                {field.required && (
                                  <Chip
                                    size="small"
                                    color="error"
                                    label="required"
                                    icon={<CheckBoxIcon fontSize="small" />}
                                  />
                                )}
                                {field.calculation.enabled && (
                                  <Chip
                                    size="small"
                                    color="info"
                                    label="calculated"
                                    icon={<NumbersIcon fontSize="small" />}
                                  />
                                )}
                                {field.condition && (
                                  <Chip
                                    size="small"
                                    color="warning"
                                    label="conditional"
                                    icon={<TuneIcon fontSize="small" />}
                                  />
                                )}
                                {field.system && (
                                  <Chip size="small" label="seed" />
                                )}
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                name: <code>{field.name}</code>
                                {field.placeholder &&
                                  ` · "${field.placeholder}"`}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit field">
                              <IconButton
                                color="primary"
                                onClick={() => openEdit(field)}
                                aria-label={`Edit ${field.label}`}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete field">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteField(field.id)}
                                aria-label={`Delete ${field.label}`}
                                size="small"
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
                {orderedFields.length === 0 && (
                  <Alert severity="info" icon={<DashboardCustomizeIcon />}>
                    No fields yet. Click <strong>Add New Field</strong> to begin.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {tab === 'responsive' && (
          <ResponsiveDesigner
            fields={orderedFields}
            screen={screenDraft}
            colorMode={colorMode}
            onSave={(next) => persist({ ...config, fields: next })}
          />
        )}

        {tab === 'appearance' && (
          <Card className="rise-in" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: 'secondary.main',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <PaletteIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Form Appearance
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Colours and layout of the public website form.
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    disabled={!screenDirty}
                    onClick={() => {
                      setScreenDraft(config.screen ?? DEFAULT_SCREEN_STYLE);
                      setScreenDirty(false);
                    }}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={!screenDirty}
                    onClick={handleSaveScreen}
                  >
                    Save Appearance
                  </Button>
                </Stack>
              </Stack>

              <Box
                sx={{
                  mb: 2.5,
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  display: 'inline-flex',
                  gap: 0.5,
                }}
              >
                {(['light', 'dark'] as ColorMode[]).map((mode) => {
                  const active = colorMode === mode;
                  return (
                    <Button
                      key={mode}
                      size="small"
                      onClick={() => setColorMode(mode)}
                      startIcon={
                        mode === 'light' ? <LightModeIcon /> : <DarkModeIcon />
                      }
                      disableElevation
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 1.5,
                        px: 2.5,
                        minWidth: 130,
                        bgcolor: active ? 'background.paper' : 'transparent',
                        color: active ? 'text.primary' : 'text.secondary',
                        boxShadow: active ? 1 : 0,
                        '&:hover': {
                          bgcolor: active
                            ? 'background.paper'
                            : 'action.selected',
                        },
                      }}
                    >
                      {mode === 'light' ? 'Light mode' : 'Dark mode'}
                    </Button>
                  );
                })}
              </Box>

              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                You are editing the{' '}
                <strong>{colorMode === 'dark' ? 'Dark' : 'Light'} mode</strong>{' '}
                colours. These apply when the public site is in {colorMode} mode.
              </Alert>

              <Stack spacing={2}>
                <SDivider>Page</SDivider>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <ColorFieldUncontrolled
                      label="Page background colour"
                      value={currentColors.pageBgColor ?? ''}
                      placeholder={colorMode === 'dark' ? '#0f172a' : '#f8fafc'}
                      onChange={(value) => setCurrentColor('pageBgColor', value)}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <ColorFieldUncontrolled
                      label="Card background colour"
                      value={currentColors.cardBgColor ?? ''}
                      placeholder={colorMode === 'dark' ? '#111827' : '#ffffff'}
                      onChange={(value) => setCurrentColor('cardBgColor', value)}
                    />
                  </Box>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    select
                    label="Card width"
                    fullWidth
                    value={screenDraft.cardMaxWidth ?? 'md'}
                    onChange={(e) => {
                      setScreenDraft((s) => ({
                        ...s,
                        cardMaxWidth: e.target.value as FormScreenStyle['cardMaxWidth'],
                      }));
                      setScreenDirty(true);
                    }}
                  >
                    <MenuItem value="sm">Narrow (600px)</MenuItem>
                    <MenuItem value="md">Medium (900px)</MenuItem>
                    <MenuItem value="lg">Wide (1200px)</MenuItem>
                    <MenuItem value="xl">Extra wide (1500px)</MenuItem>
                  </TextField>
                  <TextField
                    label="Corner roundness (px)"
                    type="number"
                    fullWidth
                    value={screenDraft.cardBorderRadius ?? 12}
                    onChange={(e) => {
                      setScreenDraft((s) => ({
                        ...s,
                        cardBorderRadius: Number(e.target.value),
                      }));
                      setScreenDirty(true);
                    }}
                  />
                  <TextField
                    label="Card padding (px)"
                    type="number"
                    fullWidth
                    value={screenDraft.cardPadding ?? 32}
                    onChange={(e) => {
                      setScreenDraft((s) => ({
                        ...s,
                        cardPadding: Number(e.target.value),
                      }));
                      setScreenDirty(true);
                    }}
                  />
                </Stack>

                <SDivider>Text</SDivider>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Title"
                    fullWidth
                    value={screenDraft.titleText ?? ''}
                    onChange={(e) => {
                      setScreenDraft((s) => ({ ...s, titleText: e.target.value }));
                      setScreenDirty(true);
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <ColorFieldUncontrolled
                      label="Title colour"
                      value={currentColors.titleColor ?? ''}
                      placeholder={colorMode === 'dark' ? '#f8fafc' : '#0f172a'}
                      onChange={(value) => setCurrentColor('titleColor', value)}
                    />
                  </Box>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Subtitle"
                    fullWidth
                    value={screenDraft.subtitleText ?? ''}
                    onChange={(e) => {
                      setScreenDraft((s) => ({ ...s, subtitleText: e.target.value }));
                      setScreenDirty(true);
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <ColorFieldUncontrolled
                      label="Subtitle colour"
                      value={currentColors.subtitleColor ?? ''}
                      placeholder={colorMode === 'dark' ? '#94a3b8' : '#64748b'}
                      onChange={(value) => setCurrentColor('subtitleColor', value)}
                    />
                  </Box>
                </Stack>

                <SDivider>Spacing</SDivider>
                <TextField
                  label="Gap between fields (px)"
                  type="number"
                  fullWidth
                  value={screenDraft.fieldGap ?? 16}
                  helperText="Comfortable = 16. Compact = 8. Loose = 24."
                  onChange={(e) => {
                    setScreenDraft((s) => ({
                      ...s,
                      fieldGap: Number(e.target.value),
                    }));
                    setScreenDirty(true);
                  }}
                />

                <SDivider>Buttons</SDivider>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Submit button label"
                    fullWidth
                    value={screenDraft.submitLabel ?? ''}
                    onChange={(e) => {
                      setScreenDraft((s) => ({
                        ...s,
                        submitLabel: e.target.value,
                      }));
                      setScreenDirty(true);
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <ColorFieldUncontrolled
                      label="Submit button colour"
                      value={currentColors.submitBgColor ?? ''}
                      placeholder={colorMode === 'dark' ? '#3b82f6' : '#2563eb'}
                      onChange={(value) => setCurrentColor('submitBgColor', value)}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <ColorFieldUncontrolled
                      label="Submit text colour"
                      value={currentColors.submitTextColor ?? ''}
                      placeholder="#ffffff"
                      onChange={(value) => setCurrentColor('submitTextColor', value)}
                    />
                  </Box>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 1 }}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<RestartAltIcon />}
                    onClick={resetCurrentMode}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Reset {colorMode} to recommended
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <AddIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId
                ? `Edit: ${
                    draft.label ||
                    FIELD_TYPE_SCHEMA_MAP[draft.type]?.title ||
                    draft.type
                  }`
                : step === 'pick'
                  ? 'What type of field do you want to add?'
                  : `New ${
                      FIELD_TYPE_SCHEMA_MAP[draft.type]?.title ?? draft.type
                    }`}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {!editingId && step === 'pick' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 1.5,
              }}
            >
              {FIELD_TYPE_SCHEMAS.map((item) => {
                const TypeIcon = getFieldIcon(item.type as FieldType);
                return (
                  <Card
                    key={item.type}
                    variant="outlined"
                    onClick={() => handlePickType(item.type as FieldType)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Avatar
                        sx={{
                          bgcolor: (t) => `${t.palette.primary.main}18`,
                          color: 'primary.main',
                          width: 40,
                          height: 40,
                          mb: 1,
                        }}
                      >
                        <TypeIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {step === 'config' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
                gap: 3,
              }}
            >
              <Stack spacing={2} sx={{ pt: 1 }}>
                {error && (
                  <Alert severity="error" icon={<DeleteOutlineIcon />}>
                    {error}
                  </Alert>
                )}

                {!editingId && (
                  <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setStep('pick')}
                    sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                  >
                    Change field type
                  </Button>
                )}

                <SDivider>Basic Information</SDivider>

                <TextField
                  label="Label *"
                  fullWidth
                  value={draft.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      label,
                      name: d.name || slugify(label),
                    }));
                  }}
                  helperText="The name users will see above the field."
                />

                {draft.type !== 'heading' && draft.type !== 'divider' && (
                  <TextField
                    label="Field key *"
                    fullWidth
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    helperText="Short code used in calculations, e.g. 'full_name'."
                  />
                )}

                {draft.type !== 'divider' && (
                  <TextField
                    label={
                      draft.type === 'heading'
                        ? 'Subtitle (optional)'
                        : 'Placeholder'
                    }
                    fullWidth
                    value={draft.placeholder}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, placeholder: e.target.value }))
                    }
                    helperText={`Grey hint shown inside the input, e.g. "${PLACEHOLDER_EXAMPLES[draft.type]}"`}
                  />
                )}

                <TextField
                  label="Helper text (optional)"
                  fullWidth
                  value={draft.helper}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, helper: e.target.value }))
                  }
                  helperText="Small note shown below the field."
                />

                {draft.type !== 'heading' && draft.type !== 'divider' && (
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.required}
                          disabled={draft.calcEnabled}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              required: e.target.checked,
                            }))
                          }
                        />
                      }
                      label="Required"
                    />
                    <TextField
                      label="Default value (optional)"
                      fullWidth
                      value={draft.defaultValue}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          defaultValue: e.target.value,
                        }))
                      }
                      helperText="Pre-filled value."
                    />
                  </Stack>
                )}

                {schema && schema.props.length > 0 && (
                  <>
                    <SDivider>{schema.component} options</SDivider>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      These options come from the reusable component.
                    </Typography>
                    <Stack spacing={2}>
                      {schema.props.map((prop: PropSchema) => {
                        const value =
                          draft.componentProps[prop.key] ?? prop.default;

                        if (prop.kind === 'boolean') {
                          return (
                            <FormControlLabel
                              key={prop.key}
                              control={
                                <Checkbox
                                  checked={Boolean(value)}
                                  onChange={(e) =>
                                    setProp(prop.key, e.target.checked)
                                  }
                                />
                              }
                              label={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {prop.label}
                                  </Typography>
                                  {prop.hint && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {prop.hint}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          );
                        }
                        if (prop.kind === 'enum') {
                          return (
                            <TextField
                              key={prop.key}
                              select
                              label={prop.label}
                              fullWidth
                              value={String(value ?? '')}
                              onChange={(e) =>
                                setProp(prop.key, e.target.value)
                              }
                              helperText={prop.hint}
                            >
                              {(prop.options ?? []).map((opt) => (
                                <MenuItem
                                  key={String(opt.value)}
                                  value={String(opt.value)}
                                >
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          );
                        }
                        if (prop.kind === 'number') {
                          return (
                            <TextField
                              key={prop.key}
                              type="number"
                              label={prop.label}
                              fullWidth
                              value={value === '' ? '' : Number(value)}
                              onChange={(e) =>
                                setProp(
                                  prop.key,
                                  e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                                )
                              }
                              helperText={prop.hint}
                            />
                          );
                        }
                        return (
                          <TextField
                            key={prop.key}
                            label={prop.label}
                            fullWidth
                            value={String(value ?? '')}
                            onChange={(e) =>
                              setProp(prop.key, e.target.value)
                            }
                            helperText={prop.hint}
                          />
                        );
                      })}
                    </Stack>
                  </>
                )}

                {usesOptions && (
                  <>
                    <SDivider>Options</SDivider>
                    <TextField
                      label="List of options"
                      fullWidth
                      multiline
                      minRows={5}
                      value={draft.optionsText}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          optionsText: e.target.value,
                        }))
                      }
                      helperText="One per line. Use value|label if the stored value differs from the shown label."
                      placeholder={OPTIONS_EXAMPLES[draft.type]}
                    />
                  </>
                )}

                {isFileType && (
                  <Alert severity="info">
                    File-related options are configured above in the &quot;
                    {schema?.component}&quot; section.
                  </Alert>
                )}

                {(draft.type === 'text' ||
                  draft.type === 'textarea' ||
                  draft.type === 'number') && (
                  <>
                    <SDivider>Validation</SDivider>
                    {draft.type === 'number' ? (
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                      >
                        <TextField
                          label="Minimum value"
                          type="number"
                          fullWidth
                          value={draft.min}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, min: e.target.value }))
                          }
                        />
                        <TextField
                          label="Maximum value"
                          type="number"
                          fullWidth
                          value={draft.max}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, max: e.target.value }))
                          }
                        />
                      </Stack>
                    ) : (
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                      >
                        <TextField
                          label="Minimum length"
                          type="number"
                          fullWidth
                          value={draft.minLength}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              minLength: e.target.value,
                            }))
                          }
                        />
                        <TextField
                          label="Maximum length"
                          type="number"
                          fullWidth
                          value={draft.maxLength}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              maxLength: e.target.value,
                            }))
                          }
                        />
                      </Stack>
                    )}
                  </>
                )}

                {draft.type !== 'heading' && draft.type !== 'divider' && (
                  <>
                    <SDivider>Show this field only when…</SDivider>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                    >
                      <TextField
                        select
                        label="Another field"
                        fullWidth
                        value={draft.conditionField}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            conditionField: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">— Always show —</MenuItem>
                        {otherFields.map((f) => (
                          <MenuItem key={f.id} value={f.name}>
                            {f.label} ({f.name})
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Condition"
                        fullWidth
                        value={draft.conditionOperator}
                        disabled={!draft.conditionField}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            conditionOperator:
                              e.target.value as ConditionOperator,
                          }))
                        }
                      >
                        {CONDITION_OPERATORS.map((op) => (
                          <MenuItem key={op} value={op}>
                            {op}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Value"
                        fullWidth
                        value={draft.conditionValue}
                        disabled={!draft.conditionField}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            conditionValue: e.target.value,
                          }))
                        }
                      />
                    </Stack>
                  </>
                )}

                {(draft.type === 'text' ||
                  draft.type === 'number' ||
                  draft.type === 'select') && (
                  <>
                    <SDivider>Calculate from other fields</SDivider>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.calcEnabled}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              calcEnabled: e.target.checked,
                              ...(e.target.checked && { required: false }),
                            }))
                          }
                        />
                      }
                      label="This field is auto-calculated"
                    />
                    {draft.calcEnabled && (
                      <TextField
                        label="Formula"
                        fullWidth
                        value={draft.calcExpression}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            calcExpression: e.target.value,
                          }))
                        }
                        placeholder="e.g. {quantity} * {unit_price}"
                        helperText="Wrap field keys in {}. Supports + - * / ( )."
                      />
                    )}
                  </>
                )}

                <SDivider>Default width</SDivider>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    select
                    label="Default width (Desktop)"
                    fullWidth
                    value={draft.colSpan}
                    helperText="Change per device in the Responsive tab."
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        colSpan: Number(e.target.value) as ColSpan,
                      }))
                    }
                  >
                    {COL_SPANS.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c === 12
                          ? 'Full row (100%)'
                          : c === 6
                            ? 'Half row (50%)'
                            : c === 4
                              ? 'One third (33%)'
                              : c === 3
                                ? 'Quarter (25%)'
                                : c === 2
                                  ? 'Small (16%)'
                                  : 'Tiny (8%)'}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Variant"
                    fullWidth
                    value={draft.variant}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        variant: e.target.value as FieldVariant,
                      }))
                    }
                  >
                    {VARIANTS.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Size"
                    fullWidth
                    value={draft.size}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        size: e.target.value as FieldSize,
                      }))
                    }
                  >
                    {SIZES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <SDivider>Appearance (optional)</SDivider>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <ColorFieldUncontrolled
                      label="Text colour"
                      value={draft.textColor}
                      placeholder="inherit"
                      onChange={(value) =>
                        setDraft((d) => ({ ...d, textColor: value }))
                      }
                    />
                    <ColorFieldUncontrolled
                      label="Field background colour"
                      value={draft.backgroundColor}
                      placeholder="inherit"
                      onChange={(value) =>
                        setDraft((d) => ({ ...d, backgroundColor: value }))
                      }
                    />
                    <ColorFieldUncontrolled
                      label="Border colour"
                      value={draft.borderColor}
                      placeholder="inherit"
                      onChange={(value) =>
                        setDraft((d) => ({ ...d, borderColor: value }))
                      }
                    />
                    <TextField
                      label="Border radius (px)"
                      type="number"
                      fullWidth
                      value={draft.borderRadius}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          borderRadius: e.target.value,
                        }))
                      }
                      helperText="Rounded corners of the input box."
                    />
                    <TextField
                      label="Font weight"
                      type="number"
                      fullWidth
                      value={draft.fontWeight}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          fontWeight: e.target.value,
                        }))
                      }
                      helperText="100 = thin, 400 = normal, 700 = bold."
                    />
                  </Box>
                </Stack>
              </Stack>

              <Box
                sx={{
                  position: { md: 'sticky' },
                  top: { md: 16 },
                  alignSelf: 'start',
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: (t) =>
                      t.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 1, alignItems: 'center' }}
                  >
                    <VisibilityIcon fontSize="small" color="primary" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Live preview
                    </Typography>
                  </Stack>
                  <PreviewField
                    field={draftToFieldConfig(draft, editingId ?? 'preview')}
                  />
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(15, 23, 42, 0.12)',
                    }}
                  >
                    <Button
                      fullWidth
                      size="small"
                      disableElevation
                      sx={{
                        bgcolor: colorMode === 'dark' ? '#3b82f6' : '#2563eb',
                        color: '#ffffff',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        py: 1,
                        fontSize: 12,
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
                      }}
                    >
                      {screenDraft.submitLabel || 'Submit'}
                    </Button>
                  </Box>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          {step === 'config' && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {editingId ? 'Save Changes' : 'Set Field'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <FormPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectForm}
        currentFormKey={activeFormKey}
      />
    </Box>
  );
};

export default FormBuilder;
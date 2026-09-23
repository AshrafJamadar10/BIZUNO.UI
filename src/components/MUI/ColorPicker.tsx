import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FC,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  type SxProps,
  type TextFieldProps,
  type Theme,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import ColorizeIcon from '@mui/icons-material/Colorize';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from 'react-hook-form';

/* ============================================================
 *  CONSTANTS
 * ============================================================ */

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RECENT_KEY = 'bizuno_color_recents';
const CUSTOM_KEY = 'bizuno_color_custom';
const MAX_RECENTS = 16;

const NEUTRALS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
  '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000',
];

const FAMILIES: { name: string; shades: string[] }[] = [
  { name: 'Red', shades: ['#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626', '#991b1b'] },
  { name: 'Orange', shades: ['#ffedd5', '#fed7aa', '#fb923c', '#f97316', '#ea580c', '#9a3412'] },
  { name: 'Amber', shades: ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e'] },
  { name: 'Emerald', shades: ['#d1fae5', '#a7f3d0', '#34d399', '#10b981', '#059669', '#065f46'] },
  { name: 'Sky', shades: ['#e0f2fe', '#bae6fd', '#38bdf8', '#0ea5e9', '#0284c7', '#075985'] },
  { name: 'Blue', shades: ['#dbeafe', '#bfdbfe', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af'] },
  { name: 'Violet', shades: ['#ede9fe', '#ddd6fe', '#a78bfa', '#8b5cf6', '#7c3aed', '#5b21b6'] },
  { name: 'Pink', shades: ['#fce7f3', '#fbcfe8', '#f472b6', '#ec4899', '#db2777', '#9d174d'] },
];

/* ============================================================
 *  COLOR MATH
 * ============================================================ */

type Rgb = { r: number; g: number; b: number; a: number };
type Hsv = { h: number; s: number; v: number; a: number };
type Hsl = { h: number; s: number; l: number };

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

const hsvToRgb = ({ h, s, v, a }: Hsv): Rgb => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a,
  };
};

const rgbToHsv = ({ r, g, b, a }: Rgb): Hsv => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max, a };
};

const rgbToHex = ({ r, g, b }: Rgb) =>
  '#' +
  [r, g, b]
    .map((n) => Math.round(n).toString(16).padStart(2, '0'))
    .join('');

const rgbaToHex = ({ r, g, b, a }: Rgb) =>
  a < 1
    ? rgbToHex({ r, g, b, a }) +
      Math.round(a * 255)
        .toString(16)
        .padStart(2, '0')
    : rgbToHex({ r, g, b, a });

const hexToRgb = (hex: string): Rgb | null => {
  const h = hex.trim();
  if (/^#([0-9a-fA-F]{3})$/.test(h)) {
    const [, r, g, b] = h;
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: 1,
    };
  }
  if (/^#([0-9a-fA-F]{6})$/.test(h)) {
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
      a: 1,
    };
  }
  if (/^#([0-9a-fA-F]{8})$/.test(h)) {
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
      a: parseInt(h.slice(7, 9), 16) / 255,
    };
  }
  return null;
};

const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number): Rgb => {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a: 1,
  };
};

const contrastFg = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const l = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return l > 0.6 ? '#0f172a' : '#ffffff';
};

/* ============================================================
 *  STORAGE
 * ============================================================ */

const readStore = (key: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === 'string');
  } catch {
    return [];
  }
};

const writeStore = (key: string, value: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage disabled */
  }
};

/* ============================================================
 *  INTERNAL SUB-COMPONENTS
 * ============================================================ */

interface SquareProps {
  hsv: Hsv;
  onChange: (s: number, v: number) => void;
}

const SaturationValueSquare: FC<SquareProps> = ({ hsv, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width);
      const y = clamp((clientY - rect.top) / rect.height);
      onChange(x, 1 - y);
    },
    [onChange],
  );

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e.clientX, e.clientY);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) update(e.clientX, e.clientY);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const pure = rgbToHex(hsvToRgb({ ...hsv, s: 1, v: 1 }));
  const dotColor = rgbToHex(hsvToRgb(hsv));

  return (
    <Box
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      sx={{
        position: 'relative',
        width: '100%',
        height: 180,
        borderRadius: 2,
        cursor: 'crosshair',
        touchAction: 'none',
        border: '1px solid',
        borderColor: 'divider',
        background: `
          linear-gradient(to top, #000 0%, transparent 100%),
          linear-gradient(to right, #fff 0%, transparent 100%),
          ${pure}
        `,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)',
          bgcolor: dotColor,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

interface HueProps {
  hue: number;
  onChange: (h: number) => void;
}

const HueSlider: FC<HueProps> = ({ hue, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onChange(clamp((clientX - rect.left) / rect.width) * 360);
    },
    [onChange],
  );

  return (
    <Box
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) update(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      sx={{
        position: 'relative',
        width: '100%',
        height: 14,
        borderRadius: '7px',
        cursor: 'pointer',
        touchAction: 'none',
        border: '1px solid',
        borderColor: 'divider',
        background:
          'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${(hue / 360) * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '3px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)',
          bgcolor: rgbToHex(hsvToRgb({ h: hue, s: 1, v: 1, a: 1 })),
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

interface AlphaProps {
  hsv: Hsv;
  onChange: (a: number) => void;
}

const AlphaSlider: FC<AlphaProps> = ({ hsv, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onChange(clamp((clientX - rect.left) / rect.width));
    },
    [onChange],
  );

  const solid = rgbToHex(hsvToRgb(hsv));

  return (
    <Box
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) update(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      sx={{
        position: 'relative',
        width: '100%',
        height: 14,
        borderRadius: '7px',
        cursor: 'pointer',
        touchAction: 'none',
        border: '1px solid',
        borderColor: 'divider',
        background: `
          linear-gradient(to right, transparent 0%, ${solid} 100%),
          repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px
        `,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${hsv.a * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '3px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)',
          bgcolor: solid,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

interface SwatchProps {
  color: string;
  selected: boolean;
  onSelect: () => void;
  onContextMenu?: () => void;
}

const Swatch: FC<SwatchProps> = ({ color, selected, onSelect, onContextMenu }) => (
  <Box
    onClick={onSelect}
    onContextMenu={
      onContextMenu
        ? (e) => {
            e.preventDefault();
            onContextMenu();
          }
        : undefined
    }
    sx={{
      width: '100%',
      aspectRatio: '1 / 1',
      borderRadius: 0.75,
      bgcolor: color,
      border: '1px solid',
      borderColor: 'divider',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.12s, box-shadow 0.12s',
      '&:hover': { transform: 'scale(1.12)', boxShadow: 2, zIndex: 1 },
      ...(selected && {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: 1,
      }),
    }}
  >
    {selected && <CheckIcon sx={{ fontSize: 14, color: contrastFg(color) }} />}
  </Box>
);

/* ============================================================
 *  CORE PICKER (used by both dialog and popover)
 * ============================================================ */

type FormatTab = 'hex' | 'rgb' | 'hsl';

export interface ColorPickerCoreProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  showAlpha?: boolean;
}

const ColorPickerCore: FC<ColorPickerCoreProps> = ({
  value,
  onChange,
  showAlpha = true,
}) => {
  const [tab, setTab] = useState<FormatTab>('hex');
  const [recents, setRecents] = useState<string[]>(() => readStore(RECENT_KEY));
  const [customs, setCustoms] = useState<string[]>(() => readStore(CUSTOM_KEY));

  const rgb = useMemo(
    () => hexToRgb(value) ?? { r: 37, g: 99, b: 235, a: 1 },
    [value],
  );
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const hex = useMemo(() => rgbaToHex(rgb), [rgb]);

  const emit = useCallback(
    (next: Hsv) => onChange(rgbaToHex(hsvToRgb(next))),
    [onChange],
  );

  const pushRecent = useCallback((color: string) => {
    setRecents((prev) => {
      const next = [color, ...prev.filter((c) => c !== color)].slice(0, MAX_RECENTS);
      writeStore(RECENT_KEY, next);
      return next;
    });
  }, []);

  const saveCustom = () => {
    if (!customs.includes(hex)) {
      const next = [...customs, hex];
      setCustoms(next);
      writeStore(CUSTOM_KEY, next);
    }
  };

  const removeCustom = (color: string) => {
    const next = customs.filter((c) => c !== color);
    setCustoms(next);
    writeStore(CUSTOM_KEY, next);
  };

  const pickEyedropper = async () => {
    const w = window as unknown as {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    };
    if (!w.EyeDropper) return;
    try {
      const result = await new w.EyeDropper().open();
      onChange(result.sRGBHex);
      pushRecent(result.sRGBHex);
    } catch {
      /* cancelled */
    }
  };

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      /* ignore */
    }
  };

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <Stack spacing={2.5}>
      {/* Preview row */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
          }}
        >
          <Box sx={{ width: '100%', height: '100%', borderRadius: 2, bgcolor: hex }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Current
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, fontFamily: 'monospace' }}
          >
            {hex}
          </Typography>
        </Box>
        <Tooltip title="Copy hex">
          <IconButton size="small" onClick={() => void copyHex()}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {hasEyeDropper && (
          <Tooltip title="Pick from screen">
            <IconButton size="small" onClick={() => void pickEyedropper()}>
              <ColorizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Square + sliders */}
      <SaturationValueSquare hsv={hsv} onChange={(s, v) => emit({ ...hsv, s, v })} />

      <Stack spacing={1.25}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{ minWidth: 32, fontWeight: 600, color: 'text.secondary' }}
          >
            Hue
          </Typography>
          <HueSlider hue={hsv.h} onChange={(h) => emit({ ...hsv, h })} />
        </Box>
        {showAlpha && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{ minWidth: 32, fontWeight: 600, color: 'text.secondary' }}
            >
              Alpha
            </Typography>
            <AlphaSlider hsv={hsv} onChange={(a) => emit({ ...hsv, a })} />
          </Box>
        )}
      </Stack>

      {/* Format tabs */}
      <Tabs
        value={tab}
        onChange={(_e, v: FormatTab) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 34,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': { minHeight: 34, fontSize: 12, textTransform: 'none' },
        }}
      >
        <Tab value="hex" label="HEX" />
        <Tab value="rgb" label="RGB" />
        <Tab value="hsl" label="HSL" />
      </Tabs>

      {tab === 'hex' && (
        <TextField
          size="small"
          fullWidth
          value={hex}
          onChange={(e) => {
            const v = e.target.value;
            if (HEX_RE.test(v) || v === '#') onChange(v);
          }}
          placeholder="#2563eb"
          error={!HEX_RE.test(hex)}
          helperText={!HEX_RE.test(hex) ? 'Invalid hex' : ' '}
          slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
        />
      )}

      {tab === 'rgb' && (
        <Stack spacing={1.25}>
          {(['r', 'g', 'b'] as const).map((ch) => (
            <Box key={ch} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Typography
                variant="caption"
                sx={{ minWidth: 16, fontWeight: 700, textTransform: 'uppercase' }}
              >
                {ch}
              </Typography>
              <Box
                component="input"
                type="range"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  emit(rgbToHsv({ ...rgb, [ch]: Number(e.target.value) }))
                }
                style={{ flex: 1, accentColor: rgbToHex(rgb) }}
              />
              <TextField
                size="small"
                type="number"
                value={rgb[ch]}
                onChange={(e) =>
                  emit(
                    rgbToHsv({
                      ...rgb,
                      [ch]: clamp(Number(e.target.value), 0, 255),
                    }),
                  )
                }
                sx={{ width: 80 }}
              />
            </Box>
          ))}
        </Stack>
      )}

      {tab === 'hsl' && (
        <Stack spacing={1.25}>
          {(
            [
              ['H', 0, 360, hsl.h, (v: number) => hslToRgb(v, hsl.s, hsl.l)],
              ['S', 0, 100, hsl.s, (v: number) => hslToRgb(hsl.h, v, hsl.l)],
              ['L', 0, 100, hsl.l, (v: number) => hslToRgb(hsl.h, hsl.s, v)],
            ] as const
          ).map(([ch, min, max, val, build]) => (
            <Box key={ch} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ minWidth: 16, fontWeight: 700 }}>
                {ch}
              </Typography>
              <Box
                component="input"
                type="range"
                min={min}
                max={max}
                value={val}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  emit(rgbToHsv(build(Number(e.target.value))))
                }
                style={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                value={val}
                onChange={(e) => emit(rgbToHsv(build(Number(e.target.value))))}
                sx={{ width: 80 }}
              />
            </Box>
          ))}
        </Stack>
      )}

      <Divider />

      {/* Recents */}
      {recents.length > 0 && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
              }}
            >
              Recent
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setRecents([]);
                writeStore(RECENT_KEY, []);
              }}
              sx={{ textTransform: 'none', minWidth: 'auto', fontSize: 11 }}
            >
              Clear
            </Button>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 0.75,
            }}
          >
            {recents.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={hex.toLowerCase() === c.toLowerCase()}
                onSelect={() => {
                  onChange(c);
                  pushRecent(c);
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* My colors */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            My colors
          </Typography>
          <Button
            size="small"
            onClick={saveCustom}
            disabled={customs.includes(hex)}
            sx={{ textTransform: 'none', minWidth: 'auto', fontSize: 11 }}
          >
            + Save current
          </Button>
        </Box>
        {customs.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            Right-click a swatch to remove it.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 0.75,
            }}
          >
            {customs.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={hex.toLowerCase() === c.toLowerCase()}
                onSelect={() => onChange(c)}
                onContextMenu={() => removeCustom(c)}
              />
            ))}
          </Box>
        )}
      </Box>

      <Divider />

      {/* Neutrals */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            display: 'block',
            mb: 1,
          }}
        >
          Neutrals
        </Typography>
        <Box
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5 }}
        >
          {NEUTRALS.map((c) => (
            <Swatch
              key={c}
              color={c}
              selected={hex.toLowerCase() === c}
              onSelect={() => {
                onChange(c);
                pushRecent(c);
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Families */}
      {FAMILIES.map((fam) => (
        <Box key={fam.name}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            {fam.name}
          </Typography>
          <Box
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5 }}
          >
            {fam.shades.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={hex.toLowerCase() === c}
                onSelect={() => {
                  onChange(c);
                  pushRecent(c);
                }}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

/* ============================================================
 *  1) DIALOG WRAPPER
 * ============================================================ */

export interface ColorPickerDialogProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  showAlpha?: boolean;
}

export const ColorPickerDialog: FC<ColorPickerDialogProps> = ({
  open,
  onClose,
  value,
  onChange,
  label,
  showAlpha = true,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    slotProps={{ paper: { sx: { borderRadius: 3 } } }}
  >
    <DialogTitle
      sx={{
        fontWeight: 700,
        fontSize: 16,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <PaletteIcon fontSize="small" color="primary" />
      {label ? `Pick a color — ${label}` : 'Pick a color'}
    </DialogTitle>
    <DialogContent sx={{ pt: 2.5 }}>
      <ColorPickerCore
        value={value}
        onChange={onChange}
        label={label}
        showAlpha={showAlpha}
      />
    </DialogContent>
    <DialogActions
      sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Button
        onClick={() => {
          onChange('');
          onClose();
        }}
        sx={{ textTransform: 'none' }}
      >
        Clear
      </Button>
      <Button
        variant="contained"
        onClick={onClose}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Done
      </Button>
    </DialogActions>
  </Dialog>
);

/* ============================================================
 *  2) RHF-CONTROLLED FIELD
 * ============================================================ */

export interface ColorFieldProps
  extends Omit<TextFieldProps, 'name' | 'value' | 'onChange'> {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  showClear?: boolean;
  sx?: SxProps<Theme>;
}

const ColorFieldInner: FC<ColorFieldProps> = ({
  name,
  label,
  required = false,
  helperText,
  showClear = true,
  sx,
  ...rest
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const [open, setOpen] = useState(false);
  const errorMessage = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name as Path<FieldValues>}
      control={control}
      rules={{
        validate: (v) => {
          const value = v as string | undefined;
          if (!value) return true;
          return HEX_RE.test(value) || 'Use a valid hex code like #2563eb';
        },
      }}
      render={({ field }) => {
        const value = (field.value as string) || '';
        const isValid = !value || HEX_RE.test(value);

        return (
          <>
            <TextField
              {...rest}
              {...field}
              value={value}
              label={label}
              fullWidth
              required={required}
              error={Boolean(errorMessage)}
              helperText={errorMessage || helperText || ' '}
              placeholder="#2563eb"
              onChange={(e) => field.onChange(e.target.value)}
              slotProps={{
                input: {
                 startAdornment: (
  <InputAdornment position="start">
    <Box
      onClick={() => setOpen(true)}
      sx={{
        width: 22,
        height: 22,
        borderRadius: 0.75,
        border: '1px solid',
        borderColor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(15, 23, 42, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        background:
          'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          bgcolor: isValid && value ? value : 'transparent',
          borderRadius: 'inherit',
        },
      }}
    />
  </InputAdornment>
),
                  endAdornment: (
                    <InputAdornment position="end">
                      {showClear && value && (
                        <Tooltip title="Clear">
                          <IconButton
                            size="small"
                            onClick={() => field.onChange('')}
                            aria-label="Clear color"
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Pick a color">
                        <IconButton
                          size="small"
                          onClick={() => setOpen(true)}
                          aria-label="Open color palette"
                        >
                          <PaletteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiInputLabel-asterisk': { color: 'error.main' },
                ...sx,
              }}
            />
           <ColorPickerDialog
  key={open ? 'open' : 'closed'}
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={field.onChange}
  label={label}
/>
          </>
        );
      }}
    />
  );
};

export const ColorField = ColorFieldInner;

/* ============================================================
 *  3) UNCONTROLLED FIELD
 * ============================================================ */

export interface ColorFieldUncontrolledProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  placeholder?: string;
  showClear?: boolean;
  showAlpha?: boolean;
}

export const ColorFieldUncontrolled: FC<ColorFieldUncontrolledProps> = ({
  label,
  value,
  onChange,
  helperText,
  placeholder = '#2563eb',
  showClear = true,
  showAlpha = true,
}) => {
  const [open, setOpen] = useState(false);
  const isValid = !value || HEX_RE.test(value);

  return (
    <>
      <TextField
        label={label}
        value={value}
        fullWidth
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={!isValid}
        helperText={!isValid ? 'Invalid hex code' : helperText || ' '}
        slotProps={{
          input: {
            startAdornment: (
  <InputAdornment position="start">
    <Box
      onClick={() => setOpen(true)}
      sx={{
        width: 22,
        height: 22,
        borderRadius: 0.75,
        border: '1px solid',
        borderColor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(15, 23, 42, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        background:
          'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          bgcolor: isValid && value ? value : 'transparent',
          borderRadius: 'inherit',
        },
      }}
    />
  </InputAdornment>
),
            endAdornment: (
              <InputAdornment position="end">
                {showClear && value && (
                  <Tooltip title="Clear">
                    <IconButton
                      size="small"
                      onClick={() => onChange('')}
                      aria-label="Clear color"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Pick a color">
                  <IconButton
                    size="small"
                    onClick={() => setOpen(true)}
                    aria-label="Open color palette"
                  >
                    <PaletteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />
      <ColorPickerDialog
  key={open ? 'open' : 'closed'}
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={onChange}
  label={label}
  showAlpha={showAlpha}
/>
    </>
  );
};

/* ============================================================
 *  OPTIONAL HOOK — for cases needing the raw picker inside a drawer
 * ============================================================ */

export const useColorPickerState = (initial = '') => {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  return { value, setValue, open, setOpen };
};

/* ============================================================
 *  DEFAULT EXPORT — core picker for maximum flexibility
 * ============================================================ */

export default ColorPickerCore;
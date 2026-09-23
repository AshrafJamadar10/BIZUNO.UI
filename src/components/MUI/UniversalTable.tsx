import {
  Box,
  Checkbox,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  Tooltip,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Chip,
  InputAdornment,
  type TableCellProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import {
  useMemo,
  useState,
  type ReactNode,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
} from "react";
import {
  IconTrashX,
  IconSearch,
  IconFilterOff,
  IconArrowUp,
  IconArrowDown,
  IconSelector,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import ExportIcons from "@/utils/ExportIcons";
import { iconMap } from "@/utils/Icons";

export const ACTION_KEY = "actionbutton" as const;
export const SR_NO_KEY = "sr_no" as const;

export type Column<T> = {
  key: keyof T | typeof ACTION_KEY;
  label: string;
  render?: (row: T, index?: number) => ReactNode;
  exportable?: boolean;
  sortable?: boolean;
  minWidth?: number | string;
  width?: number | string;
  maxWidth?: number | string;
  align?: "left" | "center" | "right";
};

export type DropdownOption = {
  value: string;
  label: string;
  bgColor?: string;
  textColor?: string;
};

export type FooterRow = {
  content: Array<{ value: ReactNode; colSpan?: number }>;
};

export type RowClickTarget<T> = "all" | keyof T | typeof ACTION_KEY;

export type RowClickConfig<T> = {
  target?: RowClickTarget<T>;
  handler: (row: T, index: number) => void;
};

export type ExportConfig = {
  mode?: "all" | "uiShows";
  enabled?: boolean;
  filename?: string;
  showCopy?: boolean;
  showExcel?: boolean;
  showCSV?: boolean;
  showPDF?: boolean;
  showWord?: boolean;
  showPrint?: boolean;
};

export type SearchConfig = {
  enabled?: boolean;
  highlightColor?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export type CaptionConfig = {
  content: ReactNode;
  sx?: SxProps<Theme>;
};

export type HeaderConfig = {
  title?: ReactNode;
  subtitle?: ReactNode;
  countLabel?: (count: number) => ReactNode;
};

export type TableStyles = {
  paper?: SxProps<Theme>;
  header?: SxProps<Theme>;
  caption?: SxProps<Theme>;
  rowHover?: SxProps<Theme>;
  toolbar?: SxProps<Theme>;
};

export type DropdownConfig<T> = {
  key: keyof T;
  options: readonly DropdownOption[];
  onChange?: (row: T, value: T[keyof T]) => void;
  disabled?: boolean | ((row: T) => boolean);
  width?: number;
  sx?: SxProps<Theme>;
};

export type SortDirection = "asc" | "desc";

export type SortableConfig<T> = {
  enabled?: boolean;
  defaultKey?: keyof T;
  defaultDir?: SortDirection;
  mode?: "client" | "server";
  onChange?: (key: keyof T, dir: SortDirection) => void;
};
export type BulkAction<T> = {
  key: string;
  label: string;
  icon?: ReactNode;
  color?: string;
  onClick: (rows: T[]) => void;
};

export type TableModeConfig =
  | { type: "client" }
  | {
      type: "server";
      total: number;
      page: number;
      pageSize: number;
      onPageChange: (page: number) => void;
    };

export interface UniversalTableProps<T extends Record<string, unknown>> {
  data: readonly T[];
  columns: readonly Column<T>[];
  header?: HeaderConfig;
  caption?: CaptionConfig;
  rowsPerPage?: number;
  tableSize?: "small" | "medium";
  textAlign?: TableCellProps["align"];
  search?: SearchConfig;
  export?: ExportConfig;
  sortable?: SortableConfig<T>;
  mode?: TableModeConfig;
  enableCheckbox?: boolean;
  loading?: boolean;
  getRowId?: (row: T, index: number) => string | number;
  onSelectionChange?: (rows: T[]) => void;
  onDeleteSelected?: (rows: T[]) => void;
  bulkActions?: readonly BulkAction<T>[];
  emptyState?: {
    message?: string;
    description?: string;
    icon?: ReactNode;
    action?: { label: string; onClick: () => void; icon?: ReactNode };
  };
  dropdown?: DropdownConfig<T>;
  autoUpdateDropdown?: boolean;
  onDataChange?: (rows: T[]) => void;
  actions?: Partial<Record<keyof typeof iconMap, (row: T) => void>>;
  customActionButton?: (row: T) => ReactNode;
  footerRows?: readonly FooterRow[];
  stickyHeader?: boolean;
  maxHeight?: number | string;
  showSrNo?: boolean;
  srNoLabel?: string;
  rowClick?: RowClickConfig<T>;
  toolbar?: { left?: ReactNode; right?: ReactNode };
  styles?: TableStyles;
}

const buildExportPayload = <T extends Record<string, unknown>>(
  rows: readonly T[],
  columns: readonly Column<T>[],
): {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
} => {
  const exportable = columns.filter(
    (c) =>
      c.key !== ACTION_KEY &&
      c.key !== SR_NO_KEY &&
      c.exportable !== false,
  );

  const exportColumns = [
    { key: "Sr. No.", label: "Sr. No." },
    ...exportable.map((c) => ({ key: c.label, label: c.label })),
  ];

  const data = rows.map((row, idx) => {
    const acc: Record<string, unknown> = { "Sr. No.": idx + 1 };
    for (const col of exportable) {
      acc[col.label] = row[col.key as keyof T];
    }
    return acc;
  });

  return { data, columns: exportColumns };
};

export function UniversalTable<T extends Record<string, unknown>>({
  data,
  columns,
  header,
  caption,
  rowsPerPage = 10,
  tableSize = "medium",
  textAlign = "left",
  search,
  export: exportCfg,
  sortable,
  mode,
  enableCheckbox = false,
  loading = false,
  getRowId,
  onSelectionChange,
  onDeleteSelected,
  bulkActions,
  emptyState,
  dropdown,
  autoUpdateDropdown,
  onDataChange,
  actions,
  customActionButton,
  footerRows = [],
  stickyHeader = false,
  maxHeight = "auto",
  showSrNo = false,
  srNoLabel = "Sr No",
  rowClick,
  toolbar,
  styles,
}: UniversalTableProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isServer = mode?.type === "server";
  const serverTotal = isServer ? mode.total : 0;
  const serverPage = isServer ? mode.page : 0;
  const serverPageSize = isServer ? mode.pageSize : rowsPerPage;
  const serverOnPageChange = isServer ? mode.onPageChange : undefined;

  const [clientPage, setClientPage] = useState(0);
  const [internalQuery, setInternalQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [sortKey, setSortKey] = useState<keyof T | null>(
    sortable?.defaultKey ?? null,
  );
  const [sortDir, setSortDir] = useState<SortDirection>(
    sortable?.defaultDir ?? "asc",
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchEnabled = search?.enabled ?? false;
  const highlightColor =
    search?.highlightColor ?? (isDark ? "#facc15" : "#ffeb3b");
  const searchPlaceholder = search?.placeholder ?? "Search...";
  const query = search?.value ?? internalQuery;

  const exportMode = exportCfg?.mode ?? "all";
  const exportEnabled = exportCfg?.enabled ?? false;
  const exportFilename = exportCfg?.filename ?? "Export";

  const rowClickTarget: RowClickTarget<T> = rowClick?.target ?? "all";
  const rowClickHandler = rowClick?.handler;

  const sortableEnabled = sortable?.enabled ?? false;
  const sortableMode = sortable?.mode ?? "client";

  const emptyMessage = emptyState?.message ?? "No data available";
  const emptyDescription = emptyState?.description;
  const emptyIcon = emptyState?.icon;
  const emptyAction = emptyState?.action;

  const effectivePage = isServer ? serverPage : clientPage;
  const effectivePageSize = isServer ? serverPageSize : rowsPerPage;

  useEffect(() => {
    if (!isServer) setClientPage(0);
  }, [query, isServer]);

  const resolveRowId = useCallback(
    (row: T, index: number): string | number =>
      getRowId ? getRowId(row, index) : index,
    [getRowId],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (search?.onChange) {
        search.onChange(value);
        return;
      }
      setInternalQuery(value);
    },
    [search],
  );

  const highlightText = useCallback(
    (text: string | number | null | undefined): ReactNode => {
      if (!query || text == null) return text;
      const textString = text.toString();
      const lower = query.toLowerCase();
      if (!textString.toLowerCase().includes(lower)) return textString;
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = textString.split(regex);
      return parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <mark
            key={i}
            style={{
              background: highlightColor,
              color: isDark ? "#000" : "#1a1a1a",
              padding: "2px 2px",
              borderRadius: 3,
              fontWeight: 700,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
    },
    [query, highlightColor, isDark],
  );

  const palette = useMemo(() => {
    const primary = theme.palette.primary.main;

    if (isDark) {
      return {
        paperBg: "#111827",
        paperBorder: alpha(theme.palette.common.white, 0.08),
        titleColor: "#f8fafc",
        subtitleColor: alpha("#e2e8f0", 0.65),
        toolbarBg: "#111827",
        toolbarBorder: alpha(theme.palette.common.white, 0.08),
        searchBg: alpha(theme.palette.common.white, 0.03),
        searchBorder: alpha(theme.palette.common.white, 0.1),
        searchText: "#f8fafc",
        searchIconColor: alpha("#e2e8f0", 0.5),
        searchPlaceholder: alpha("#e2e8f0", 0.4),
        headerBg: "#0f172a",
        headerText: alpha("#e2e8f0", 0.7),
        headerBorder: alpha(theme.palette.common.white, 0.08),
        cellText: "#f1f5f9",
        cellMuted: alpha("#e2e8f0", 0.6),
        cellBorder: alpha(theme.palette.common.white, 0.06),
        rowAlt: alpha(theme.palette.common.white, 0.015),
        rowHover: alpha(theme.palette.common.white, 0.04),
        rowSelected: alpha(primary, 0.18),
        footerBg: "#0f172a",
        chipBg: alpha(primary, 0.18),
        chipText: "#93c5fd",
        emptyIcon: alpha("#e2e8f0", 0.35),
        scrollTrack: alpha(theme.palette.common.black, 0.25),
        scrollThumb: alpha(theme.palette.common.white, 0.15),
      };
    }
    return {
      paperBg: "#ffffff",
      paperBorder: alpha(theme.palette.divider, 0.9),
      titleColor: "#0f172a",
      subtitleColor: alpha("#0f172a", 0.6),
      toolbarBg: "#ffffff",
      toolbarBorder: alpha(theme.palette.divider, 0.9),
      searchBg: alpha(theme.palette.common.black, 0.015),
      searchBorder: alpha(theme.palette.divider, 1),
      searchText: "#0f172a",
      searchIconColor: alpha("#0f172a", 0.4),
      searchPlaceholder: alpha("#0f172a", 0.4),
      headerBg: "#f8fafc",
      headerText: alpha("#0f172a", 0.6),
      headerBorder: alpha(theme.palette.divider, 1),
      cellText: "#0f172a",
      cellMuted: alpha("#0f172a", 0.55),
      cellBorder: alpha(theme.palette.divider, 0.8),
      rowAlt: alpha(theme.palette.common.black, 0.008),
      rowHover: alpha(theme.palette.common.black, 0.02),
      rowSelected: alpha(primary, 0.06),
      footerBg: "#f8fafc",
      chipBg: alpha(primary, 0.1),
      chipText: primary,
      emptyIcon: alpha("#0f172a", 0.3),
      scrollTrack: alpha(theme.palette.common.black, 0.05),
      scrollThumb: alpha(theme.palette.common.black, 0.15),
    };
  }, [theme, isDark]);

  const sortedData = useMemo(() => {
    if (!sortableEnabled || !sortKey || sortableMode === "server") {
      return [...data];
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [data, sortableEnabled, sortKey, sortDir, sortableMode]);

  const filteredData = useMemo(() => {
    if (isServer || !query) return sortedData;
    const lower = query.toLowerCase();
    return sortedData.filter((row) =>
      columns.some((col) => {
        if (col.key === ACTION_KEY) return false;
        return String(row[col.key as keyof T] ?? "")
          .toLowerCase()
          .includes(lower);
      }),
    );
  }, [sortedData, columns, query, isServer]);

  const paginatedData = useMemo(() => {
    if (isServer) return filteredData;
    return filteredData.slice(
      clientPage * rowsPerPage,
      clientPage * rowsPerPage + rowsPerPage,
    );
  }, [filteredData, clientPage, rowsPerPage, isServer]);

  const totalCount = isServer ? serverTotal : filteredData.length;

  const exportColumnsSource = useMemo<readonly Column<T>[]>(
    () => columns.filter((c) => c.exportable !== false),
    [columns],
  );

  const { data: exportData, columns: exportColumns } = useMemo(
    () =>
      buildExportPayload(
        filteredData,
        exportMode === "uiShows" ? exportColumnsSource : columns,
      ),
    [filteredData, columns, exportColumnsSource, exportMode],
  );

  const selectedRows = useMemo(
    () => data.filter((_, i) => selectedIds.has(resolveRowId(_, i))),
    [data, selectedIds, resolveRowId],
  );

  const toggleRow = useCallback(
    (row: T, index: number) => {
      const id = resolveRowId(row, index);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange?.(data.filter((r, i) => next.has(resolveRowId(r, i))));
        return next;
      });
    },
    [data, onSelectionChange, resolveRowId],
  );

  const toggleAll = useCallback(
    (checked: boolean) => {
      const next = new Set<string | number>();
      if (checked) data.forEach((r, i) => next.add(resolveRowId(r, i)));
      setSelectedIds(next);
      onSelectionChange?.(checked ? [...data] : []);
    },
    [data, onSelectionChange, resolveRowId],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const updateRow = useCallback(
    (row: T, patch: Partial<T>) => {
      if (!onDataChange) return;
      const targetId = resolveRowId(row, -1);
      onDataChange(
        data.map((r, i) =>
          resolveRowId(r, i) === targetId ? { ...r, ...patch } : r,
        ),
      );
    },
    [data, onDataChange, resolveRowId],
  );

  const isWholeRowClickable =
    rowClickTarget === "all" && Boolean(rowClickHandler);
  const isCellClickable = useCallback(
    (key: keyof T | typeof ACTION_KEY): boolean =>
      Boolean(rowClickHandler) && rowClickTarget === key,
    [rowClickHandler, rowClickTarget],
  );

  const onRowClickInternal = useCallback(
    (row: T, index: number) => {
      rowClickHandler?.(row, index);
    },
    [rowClickHandler],
  );

  const onCellClickInternal = useCallback(
    (e: MouseEvent, row: T, index: number) => {
      if (!rowClickHandler) return;
      e.stopPropagation();
      rowClickHandler(row, index);
    },
    [rowClickHandler],
  );

  const handleSortClick = useCallback(
    (col: Column<T>) => {
      if (!sortableEnabled) return;
      if (col.key === ACTION_KEY || col.key === SR_NO_KEY) return;
      if (col.sortable === false) return;

      const key = col.key as keyof T;
      const nextDir: SortDirection =
        sortKey === key && sortDir === "asc" ? "desc" : "asc";

      setSortKey(key);
      setSortDir(nextDir);
      sortable?.onChange?.(key, nextDir);
    },
    [sortableEnabled, sortKey, sortDir, sortable],
  );

  const getGlobalIndex = useCallback(
    (pageIndex: number): number =>
      effectivePage * effectivePageSize + pageIndex + 1,
    [effectivePage, effectivePageSize],
  );

  const allColumns = useMemo<readonly Column<T>[]>(() => {
    if (!showSrNo) return columns;
    return [
      {
        key: SR_NO_KEY,
        label: srNoLabel,
        width: 60,
        align: "center",
      } as Column<T>,
      ...columns,
    ];
  }, [columns, showSrNo, srNoLabel]);

  const getColumnStyle = useCallback((col: Column<T>): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (col.width) style.width = col.width;
    if (col.minWidth) style.minWidth = col.minWidth;
    if (col.maxWidth) {
      style.maxWidth = col.maxWidth;
      style.whiteSpace = "normal";
      style.wordBreak = "break-word";
    }
    return style;
  }, []);

  const dropdownSx: SxProps<Theme> = useMemo(
    () => ({
      width: 150,
      bgcolor: palette.searchBg,
      color: palette.cellText,
      fontWeight: 600,
      fontSize: 13,
      borderRadius: 2,
      "& .MuiSelect-icon": { color: palette.cellMuted },
      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
      "& fieldset": { borderColor: palette.searchBorder },
    }),
    [palette, theme],
  );

  const clickableCellSx: SxProps<Theme> = {
    cursor: "pointer",
    "&:hover .clickable-cell-text": { textDecoration: "underline" },
  };

  const tableSx: SxProps<Theme> = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "auto",
    bgcolor: palette.paperBg,
    "& .MuiTableCell-root": {
      borderColor: palette.cellBorder,
      color: palette.cellText,
    },
  };

  const showHeader = Boolean(
    header?.title ||
      header?.subtitle ||
      (exportEnabled && exportData.length > 0) ||
      toolbar?.left ||
      toolbar?.right,
  );

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: "center",
          bgcolor: palette.paperBg,
          border: `1px solid ${palette.paperBorder}`,
          ...styles?.paper,
        }}
      >
        <CircularProgress
          size={44}
          thickness={3}
          sx={{ color: theme.palette.primary.main }}
        />
        <Typography variant="body2" sx={{ mt: 2, color: palette.subtitleColor }}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: palette.paperBg,
          overflow: "hidden",
          border: `1px solid ${palette.paperBorder}`,
          ...styles?.paper,
        }}
      >
        {showHeader && (
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2.5,
              borderBottom: `1px solid ${palette.toolbarBorder}`,
              bgcolor: palette.toolbarBg,
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              ...styles?.toolbar,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {header?.title && (
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 18, sm: 22 },
                    color: palette.titleColor,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.2,
                  }}
                >
                  {header.title}
                </Typography>
              )}
              {header?.subtitle && (
                <Typography
                  sx={{
                    mt: 0.5,
                    color: palette.subtitleColor,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {header.subtitle}
                </Typography>
              )}
              {toolbar?.left && <Box sx={{ mt: 1 }}>{toolbar.left}</Box>}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                flexShrink: 0,
                flexWrap: "wrap",
              }}
            >
              {toolbar?.right}
              {exportEnabled && exportData.length > 0 && (
                <Zoom in timeout={300}>
                  <Box>
                    <ExportIcons
                      data={exportData}
                      columns={exportColumns}
                      filename={exportFilename}
                      iconSize={16}
                      variant="toolbar"
                      showCopy={exportCfg?.showCopy ?? false}
                      showExcel={exportCfg?.showExcel ?? true}
                      showCSV={exportCfg?.showCSV ?? true}
                      showPDF={exportCfg?.showPDF ?? true}
                      showWord={exportCfg?.showWord ?? false}
                      showPrint={exportCfg?.showPrint ?? true}
                    />
                  </Box>
                </Zoom>
              )}
            </Box>
          </Box>
        )}

        {caption?.content && (
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: theme.palette.primary.contrastText,
              fontWeight: 700,
              fontSize: { xs: 14, sm: 16 },
              py: 1.25,
              px: 2,
              ...caption.sx,
            }}
          >
            {caption.content}
          </Box>
        )}

        {searchEnabled && (
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 1.75,
              borderBottom: `1px solid ${palette.toolbarBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              inputRef={searchInputRef}
              variant="outlined"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              sx={{
                width: { xs: "100%", sm: 340 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: palette.searchBg,
                  color: palette.searchText,
                  fontSize: 13,
                  borderRadius: 2,
                  "& fieldset": { borderColor: palette.searchBorder },
                  "&:hover fieldset": {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                  "& input::placeholder": {
                    color: palette.searchPlaceholder,
                    opacity: 1,
                  },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={16} color={palette.searchIconColor} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                ml: "auto",
              }}
            >
              {query && (
                <Chip
                  size="small"
                  label={`"${query}"`}
                  onDelete={() => {
                    handleSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  sx={{
                    bgcolor: palette.chipBg,
                    color: palette.chipText,
                    fontWeight: 600,
                    fontSize: 12,
                    height: 24,
                  }}
                />
              )}
              {header?.countLabel && (
                <Typography
                  variant="caption"
                  sx={{
                    color: palette.subtitleColor,
                    fontSize: 12.5,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {header.countLabel(totalCount)}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <TableContainer
          sx={{
            maxHeight,
            overflowX: "auto",
            overflowY: "auto",
            position: "relative",
            bgcolor: palette.paperBg,
            "&::-webkit-scrollbar": { height: 8, width: 8 },
            "&::-webkit-scrollbar-track": {
              background: palette.scrollTrack,
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              background: palette.scrollThumb,
              borderRadius: 4,
            },
          }}
        >
          <Table size={tableSize} stickyHeader={stickyHeader} sx={tableSx}>
            <TableHead>
              <TableRow>
                {enableCheckbox && (
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      bgcolor: palette.headerBg,
                      borderBottom: `1px solid ${palette.headerBorder}`,
                      position: stickyHeader ? "sticky" : "relative",
                      top: 0,
                      zIndex: 3,
                      width: 44,
                    }}
                  >
                    <Checkbox
                      size="small"
                      indeterminate={
                        selectedIds.size > 0 && selectedIds.size < data.length
                      }
                      checked={
                        data.length > 0 && selectedIds.size === data.length
                      }
                      onChange={(e) => toggleAll(e.target.checked)}
                      sx={{
                        color: palette.cellMuted,
                        "&.Mui-checked": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  </TableCell>
                )}
                {allColumns.map((col) => {
                  const isSortable =
                    sortableEnabled &&
                    col.key !== ACTION_KEY &&
                    col.key !== SR_NO_KEY &&
                    col.sortable !== false;
                  const isActiveSort = sortKey === col.key && isSortable;

                  return (
                    <TableCell
                      key={String(col.key)}
                      align={
                        col.align ||
                        (col.key === SR_NO_KEY ? "center" : textAlign)
                      }
                      onClick={
                        isSortable ? () => handleSortClick(col) : undefined
                      }
                      sx={{
                        fontWeight: 600,
                        fontSize: 11.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        bgcolor: palette.headerBg,
                        color: palette.headerText,
                        borderBottom: `1px solid ${palette.headerBorder}`,
                        whiteSpace: "nowrap",
                        position: stickyHeader ? "sticky" : "relative",
                        top: 0,
                        zIndex: 2,
                        py: 1.5,
                        px: 2,
                        userSelect: "none",
                        cursor: isSortable ? "pointer" : "default",
                        transition: "color 0.15s ease",
                        "&:hover": isSortable
                          ? { color: palette.titleColor }
                          : undefined,
                        ...styles?.header,
                      }}
                      style={getColumnStyle(col)}
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          justifyContent:
                            col.align === "right"
                              ? "flex-end"
                              : col.align === "center"
                                ? "center"
                                : "flex-start",
                          width: "100%",
                        }}
                      >
                        {col.label}
                        {isSortable && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              color: isActiveSort
                                ? theme.palette.primary.main
                                : alpha(palette.headerText, 0.5),
                              ml: 0.25,
                            }}
                          >
                            {!isActiveSort ? (
                              <IconSelector size={13} />
                            ) : sortDir === "asc" ? (
                              <IconArrowUp size={13} />
                            ) : (
                              <IconArrowDown size={13} />
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence mode="wait">
                {paginatedData.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell
                      colSpan={allColumns.length + (enableCheckbox ? 1 : 0)}
                      align="center"
                      sx={{ py: 10, borderBottom: "none" }}
                    >
                      <Fade in timeout={400}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1.5,
                          }}
                        >
                          {emptyIcon || (
                            <IconFilterOff
                              size={48}
                              style={{ color: palette.emptyIcon }}
                            />
                          )}
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: 15,
                              color: palette.titleColor,
                            }}
                          >
                            {emptyMessage}
                          </Typography>
                          {emptyDescription && (
                            <Typography
                              sx={{
                                color: palette.subtitleColor,
                                fontSize: 13,
                                maxWidth: 380,
                              }}
                            >
                              {emptyDescription}
                            </Typography>
                          )}
                          {emptyAction && (
                            <Box
                              component="button"
                              onClick={emptyAction.onClick}
                              sx={{
                                mt: 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.75,
                                px: 2,
                                py: 0.75,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.primary.main}`,
                                bgcolor: "transparent",
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.08,
                                  ),
                                },
                              }}
                            >
                              {emptyAction.icon}
                              {emptyAction.label}
                            </Box>
                          )}
                        </Box>
                      </Fade>
                    </TableCell>
                  </motion.tr>
                ) : (
                  paginatedData.map((row, index) => {
                    const rowId = resolveRowId(row, index);
                    const isSelected = selectedIds.has(rowId);
                    const globalSrNo = getGlobalIndex(index);
                    const zebra = index % 2 === 1;
                    const baseBg = isSelected
                      ? palette.rowSelected
                      : zebra
                        ? palette.rowAlt
                        : palette.paperBg;

                    return (
                      <motion.tr
                        key={rowId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={
                          isWholeRowClickable
                            ? () => onRowClickInternal(row, index)
                            : undefined
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            palette.rowHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = baseBg;
                        }}
                        style={{
                          backgroundColor: baseBg,
                          transition: "background-color 0.15s ease",
                          cursor: isWholeRowClickable ? "pointer" : undefined,
                        }}
                      >
                        {enableCheckbox && (
                          <TableCell
                            padding="checkbox"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ width: 44, py: 1.25, px: 2 }}
                          >
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleRow(row, index);
                              }}
                              sx={{
                                color: palette.cellMuted,
                                "&.Mui-checked": {
                                  color: theme.palette.primary.main,
                                },
                              }}
                            />
                          </TableCell>
                        )}

                        {allColumns.map((col) => {
                          const cellClickable = isCellClickable(col.key);
                          const cellHandlers = cellClickable
                            ? {
                                onClick: (e: MouseEvent) =>
                                  onCellClickInternal(e, row, index),
                              }
                            : {};

                          const cellBaseSx: SxProps<Theme> = {
                            py: 1.5,
                            px: 2,
                            fontSize: 13.5,
                            color: palette.cellText,
                            borderBottom: `1px solid ${palette.cellBorder}`,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            ...(cellClickable ? clickableCellSx : {}),
                          };

                          if (col.key === SR_NO_KEY) {
                            return (
                              <TableCell
                                key={String(col.key)}
                                align="center"
                                {...cellHandlers}
                                sx={{
                                  ...cellBaseSx,
                                  fontWeight: 500,
                                  color: palette.cellMuted,
                                  whiteSpace: "nowrap",
                                  width: 60,
                                }}
                              >
                                <span className="clickable-cell-text">
                                  {globalSrNo}
                                </span>
                              </TableCell>
                            );
                          }

                          if (dropdown && col.key === dropdown.key) {
                            const isDisabled =
                              typeof dropdown.disabled === "function"
                                ? dropdown.disabled(row)
                                : dropdown.disabled || false;
                            return (
                              <TableCell
                                key={String(col.key)}
                                align={textAlign}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ ...cellBaseSx, whiteSpace: "nowrap" }}
                              >
                                <Select
                                  size="small"
                                  value={row[col.key] as string}
                                  disabled={isDisabled}
                                  sx={{
                                    ...dropdownSx,
                                    width: dropdown.width ?? 150,
                                    ...dropdown.sx,
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value as T[keyof T];
                                    dropdown.onChange?.(row, value);
                                    if (
                                      !dropdown.onChange &&
                                      autoUpdateDropdown
                                    )
                                      updateRow(row, {
                                        [dropdown.key]: value,
                                      } as Partial<T>);
                                  }}
                                >
                                  {dropdown.options.map((option) => (
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                      sx={{
                                        bgcolor:
                                          option.bgColor || "transparent",
                                        color: option.textColor || "inherit",
                                      }}
                                    >
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </TableCell>
                            );
                          }

                          if (col.key === ACTION_KEY) {
                            return (
                              <TableCell
                                key={ACTION_KEY}
                                align="center"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  ...cellBaseSx,
                                  whiteSpace: "nowrap",
                                  py: 1,
                                  px: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.25,
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  {customActionButton?.(row)}
                                  {actions &&
                                    Object.entries(iconMap).map(([k, cfg]) =>
                                      actions[k as keyof typeof iconMap] ? (
                                        <Tooltip
                                          key={k}
                                          title={cfg.label}
                                          arrow
                                          placement="top"
                                        >
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              actions[
                                                k as keyof typeof iconMap
                                              ]?.(row)
                                            }
                                            sx={{
                                              color: palette.cellMuted,
                                              p: 0.75,
                                              transition: "all 0.15s ease",
                                              "&:hover": {
                                                color: cfg.color,
                                                bgcolor: alpha(
                                                  cfg.color,
                                                  isDark ? 0.15 : 0.08,
                                                ),
                                              },
                                            }}
                                          >
                                            {cfg.icon}
                                          </IconButton>
                                        </Tooltip>
                                      ) : null,
                                    )}
                                </Box>
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell
                              key={String(col.key)}
                              align={col.align || textAlign}
                              {...cellHandlers}
                              sx={cellBaseSx}
                              style={getColumnStyle(col)}
                            >
                              <span className="clickable-cell-text">
                                {col.render
                                  ? col.render(row, index)
                                  : highlightText(String(row[col.key] ?? ""))}
                              </span>
                            </TableCell>
                          );
                        })}
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>

            {footerRows.length > 0 && (
              <TableFooter>
                {footerRows.map((footerRow, idx) => (
                  <TableRow key={idx}>
                    {footerRow.content.map((cell, cellIdx) => (
                      <TableCell
                        key={cellIdx}
                        colSpan={cell.colSpan}
                        sx={{
                          bgcolor: palette.footerBg,
                          fontWeight: 600,
                          color: palette.cellText,
                          fontSize: 13,
                          borderTop: `1px solid ${palette.cellBorder}`,
                        }}
                      >
                        {cell.value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableFooter>
            )}
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 1.5, sm: 2 },
            py: 1,
            borderTop: `1px solid ${palette.toolbarBorder}`,
            bgcolor: palette.toolbarBg,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {enableCheckbox && selectedRows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    pl: 0.5,
                    pr: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: palette.chipBg,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: palette.chipText,
                      mx: 1,
                    }}
                  >
                    {selectedRows.length} selected
                  </Typography>
                  {bulkActions?.map((action) => (
                    <Tooltip key={action.key} title={action.label} arrow>
                      <IconButton
                        size="small"
                        onClick={() => action.onClick(selectedRows)}
                        sx={{
                          color: action.color ?? theme.palette.primary.main,
                          p: 0.5,
                          "&:hover": {
                            bgcolor: alpha(
                              action.color ?? theme.palette.primary.main,
                              0.12,
                            ),
                          },
                        }}
                      >
                        {action.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                  {onDeleteSelected && (
                    <Tooltip
                      title={`Delete ${selectedRows.length} record${
                        selectedRows.length > 1 ? "s" : ""
                      }`}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={() => {
                          onDeleteSelected(selectedRows);
                          clearSelection();
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          p: 0.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.12),
                          },
                        }}
                      >
                        <IconTrashX size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </motion.div>
            )}
          </Box>

          <TablePagination
            component="div"
            count={totalCount}
            page={effectivePage}
            onPageChange={(_, newPage) => {
              if (isServer) {
                serverOnPageChange?.(newPage);
              } else {
                setClientPage(newPage);
              }
            }}
            rowsPerPage={effectivePageSize}
            rowsPerPageOptions={[]}
            sx={{
              border: "none",
              "& .MuiTablePagination-displayedRows": {
                fontSize: 12.5,
                color: palette.subtitleColor,
                fontWeight: 500,
              },
              "& .MuiTablePagination-actions .MuiIconButton-root": {
                color: palette.cellMuted,
                transition: "all 0.15s ease",
                "&:hover": {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
                "&.Mui-disabled": { color: alpha(palette.cellMuted, 0.4) },
              },
            }}
          />
        </Box>
      </Paper>
    </motion.div>
  );
}

export default UniversalTable;
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/immutability */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  OutlinedInput,
  Tooltip,
  Typography,
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material";
import {
  Check,
  Close as CloseIcon,
  CloudUpload,
  Delete,
  Description as DescriptionIcon,
  Download,
  InsertDriveFile,
  PictureAsPdf,
  Slideshow,
  TableChart,
  Visibility,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { showSnackbar } from "../MUI/ToastMessage";

type UploadSize = "small" | "medium" | "large";

interface FileUploadProps {
  name: string;
  maxFiles?: number;
  label?: string;
  placeholder?: string;
  defaultFiles?: (string | File)[];
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  maxSizeMB?: number;
  size?: UploadSize;
}

type FormValues = Record<string, unknown>;

const SIZE_TOKENS: Record<
  UploadSize,
  {
    boxPadding: number;
    dropIconSize: number;
    dropFontSize: string;
    countFontSize: string;
    fileIconSize: number;
    actionBtnSize: number;
    actionIconSize: number;
    gap: number;
  }
> = {
  small: {
    boxPadding: 1,
    dropIconSize: 15,
    dropFontSize: "0.65rem",
    countFontSize: "0.55rem",
    fileIconSize: 22,
    actionBtnSize: 18,
    actionIconSize: 11,
    gap: 0.75,
  },
  medium: {
    boxPadding: 1.5,
    dropIconSize: 18,
    dropFontSize: "0.7rem",
    countFontSize: "0.6rem",
    fileIconSize: 28,
    actionBtnSize: 22,
    actionIconSize: 13,
    gap: 1,
  },
  large: {
    boxPadding: 2,
    dropIconSize: 22,
    dropFontSize: "0.85rem",
    countFontSize: "0.7rem",
    fileIconSize: 34,
    actionBtnSize: 30,
    actionIconSize: 16,
    gap: 1.25,
  },
};

const DOC_META: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  pdf: { icon: <PictureAsPdf />, color: "#dc2626", label: "PDF" },
  doc: { icon: <DescriptionIcon />, color: "#2563eb", label: "DOC" },
  docx: { icon: <DescriptionIcon />, color: "#2563eb", label: "DOCX" },
  xls: { icon: <TableChart />, color: "#16a34a", label: "XLS" },
  xlsx: { icon: <TableChart />, color: "#16a34a", label: "XLSX" },
  csv: { icon: <TableChart />, color: "#16a34a", label: "CSV" },
  ppt: { icon: <Slideshow />, color: "#ea580c", label: "PPT" },
  pptx: { icon: <Slideshow />, color: "#ea580c", label: "PPTX" },
  txt: { icon: <InsertDriveFile />, color: "#6b7280", label: "TXT" },
};

const getFileExtension = (name: string): string => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

const getFileMeta = (file: File | string) => {
  let ext = "";
  let name = "";

  if (file instanceof File) {
    ext = getFileExtension(file.name);
    name = file.name;
  } else {
    ext = getFileExtension(file);
    name = file.split("/").pop()?.split("?")[0] || file;
  }

  const meta = DOC_META[ext] || {
    icon: <InsertDriveFile />,
    color: "#64748b",
    label: ext.toUpperCase() || "FILE",
  };

  return { ...meta, name, ext };
};

const getFileSize = (file: File | string): string => {
  if (!(file instanceof File)) return "";
  const bytes = file.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isPDF = (file: File | string): boolean => {
  if (file instanceof File) return file.type === "application/pdf";
  return file.toLowerCase().endsWith(".pdf");
};

const isImage = (file: File | string): boolean => {
  if (file instanceof File) return file.type.startsWith("image/");
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(file);
};

const isPreviewable = (file: File | string): boolean =>
  isPDF(file) || isImage(file);

const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label,
  placeholder,
  maxFiles = 5,
  defaultFiles = [],
  accept = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
  required = false,
  disabled = false,
  fullWidth = true,
  sx,
  maxSizeMB = 10,
  size = "small",
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const tokens = SIZE_TOKENS[size];

  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  const formFiles = watch(name) as (File | string)[] | undefined;
  const errorMessage = errors[name]?.message as string | undefined;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialized = useRef(false);

  const [previews, setPreviews] = useState<
    { url: string; file: File | string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    file: File | string;
  } | null>(null);

  const palette = useMemo(() => {
    const t = theme.palette;
    return {
      containerBorder: isDark
        ? "rgba(255,255,255,0.18)"
        : "rgba(15,23,42,0.28)",
      containerBorderHover: isDark ? "#ffffff" : "#000000",
      containerBorderActive: t.primary.main,
      containerBorderError: t.error.main,
      containerBg: t.background.paper,
      containerBgDrag: alpha(t.primary.main, isDark ? 0.06 : 0.03),
      containerBgDisabled: alpha(t.action.disabledBackground, 0.4),

      dropText: t.text.secondary,
      dropTextDisabled: t.text.disabled,
      dropIcon: t.text.disabled,
      dropIconActive: t.primary.main,
      dropHoverBg: alpha(t.primary.main, 0.02),

      fileListBg: isDark
        ? alpha(t.common.white, 0.015)
        : alpha(t.common.black, 0.008),
      fileRowBg: isDark ? alpha(t.common.white, 0.02) : "#ffffff",
      fileRowBorder: isDark
        ? "rgba(255,255,255,0.18)"
        : "rgba(15,23,42,0.22)",
      fileRowBorderHover: isDark ? "#ffffff" : "#000000",
      fileRowShadowHover: isDark
        ? `0 2px 8px ${alpha(t.common.black, 0.4)}`
        : `0 2px 8px ${alpha(t.common.black, 0.08)}`,

      fileName: t.text.primary,
      fileMeta: t.text.secondary,

      previewBtnBg: alpha(t.primary.main, 0.08),
      previewBtnIcon: t.primary.main,

      deleteBtnBg: alpha(t.error.main, 0.08),
      deleteBtnIcon: t.error.main,

      dialogHeaderBg: t.background.paper,
      dialogBorder: t.divider,
      dialogTitle: t.text.primary,
      dialogText: t.text.secondary,
      dialogPreviewBg: isDark
        ? alpha(t.common.black, 0.2)
        : alpha(t.common.black, 0.02),

      doneBtnBg: t.primary.main,
      doneBtnHoverBg: t.primary.dark,
    };
  }, [theme, isDark]);

  const getSafeFilesArray = useCallback(
    (): (File | string)[] => (Array.isArray(formFiles) ? formFiles : []),
    [formFiles],
  );

  const generatePreview = useCallback(
    (file: string | File): string =>
      file instanceof File ? URL.createObjectURL(file) : file,
    [],
  );

  useEffect(() => {
    if (initialized.current) return;
    if (!defaultFiles?.length) return;
    initialized.current = true;
    setValue(name, defaultFiles, { shouldValidate: false, shouldDirty: false });
  }, [defaultFiles, name, setValue]);

  useEffect(() => {
    const files = getSafeFilesArray();
    if (!files.length) {
      setPreviews([]);
      return;
    }

    const items = files
      .filter(Boolean)
      .map((file) => ({ url: generatePreview(file), file }));

    setPreviews(items);

    return () => {
      items.forEach(({ url }) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [getSafeFilesArray, generatePreview]);

  const validateSingleFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeBytes) {
        return `${file.name}: Max ${maxSizeMB}MB file allowed`;
      }

      const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
      const fileType = (file.type || "").toLowerCase();
      const fileName = (file.name || "").toLowerCase();
      const fileExt = fileName.includes(".")
        ? `.${fileName.split(".").pop()}`
        : "";

      const isTypeMatch = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) return fileType.startsWith(type.replace("/*", "/"));
        if (fileType && fileType === type) return true;
        if (type.startsWith(".") && fileExt && fileExt === type) return true;
        if (!type.includes("/") && !type.startsWith(".") && fileExt) {
          return fileExt === `.${type}`;
        }
        return false;
      });

      return isTypeMatch ? null : `${file.name}: Unsupported file format`;
    },
    [maxSizeBytes, maxSizeMB, accept],
  );

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];
      for (const file of files) {
        const err = validateSingleFile(file);
        if (err) errors.push(err);
        else valid.push(file);
      }
      return { valid, errors };
    },
    [validateSingleFile],
  );

  const addFilesToForm = useCallback(
    (files: File[]) => {
      const updated = [...getSafeFilesArray(), ...files];
      setValue(name, updated, { shouldValidate: true, shouldDirty: true });
    },
    [getSafeFilesArray, name, setValue],
  );

  const processFiles = useCallback(
    async (files: File[]): Promise<void> => {
      if (!files.length) return;

      const availableSlots = maxFiles - getSafeFilesArray().length;
      if (availableSlots <= 0) {
        showSnackbar("warning", `Maximum ${maxFiles} files only allowed`);
        return;
      }

      const filesToAdd = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
        showSnackbar("warning", `Maximum ${maxFiles} files only allowed`);
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        setUploadProgress(40);
        await new Promise((r) => setTimeout(r, 250));
        setUploadProgress(80);
        addFilesToForm(filesToAdd);
        setUploadProgress(100);
        showSnackbar(
          "success",
          `${filesToAdd.length} file(s) uploaded successfully`,
        );
      } catch (err) {
        console.error("Upload error:", err);
        showSnackbar("error", "Failed to upload files");
      } finally {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 300);
      }
    },
    [getSafeFilesArray, maxFiles, addFilesToForm],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || disabled) return;
      const { valid, errors } = validateFiles(Array.from(files));
      if (errors.length) {
        showSnackbar("error", errors[0]);
        event.target.value = "";
        return;
      }
      if (valid.length) await processFiles(valid);
      event.target.value = "";
    },
    [disabled, validateFiles, processFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) return;
      const { valid, errors } = validateFiles(files);
      if (errors.length) {
        showSnackbar("error", errors[0]);
        return;
      }
      if (valid.length) await processFiles(valid);
    },
    [disabled, validateFiles, processFiles],
  );

  const handleRemoveFile = useCallback(
    (index: number, e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      const current = getSafeFilesArray();
      const removed = current[index];

      if (typeof removed === "string") {
        setDeletedFiles((prev) => [...prev, removed]);
      }

      setValue(name, current.filter((_, i) => i !== index), {
        shouldValidate: true,
        shouldDirty: true,
      });

      const { name: fileName } = getFileMeta(removed);
      showSnackbar("error", `${fileName} deleted`);
    },
    [getSafeFilesArray, name, setValue],
  );

  const handleUploadClick = useCallback((): void => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleOpenPreview = useCallback(
    (item: { url: string; file: File | string }) => {
      if (isPreviewable(item.file)) {
        setPreviewFile(item);
      } else {
        showSnackbar("info", "Preview not available for this file type");
      }
    },
    [],
  );

  const handleClosePreview = useCallback(() => setPreviewFile(null), []);

  useEffect(() => {
    if (!deletedFiles.length) return;
    setValue("deletedFiles", deletedFiles as unknown, { shouldDirty: true });
  }, [deletedFiles, setValue]);

  register(name, {
    required: required
      ? `${label || placeholder || "File"} is required`
      : false,
    validate: {
      maxFiles: (value: unknown) => {
        const arr = value as (File | string)[] | undefined;
        if (!arr) return true;
        return arr.length <= maxFiles || `Maximum ${maxFiles} files allowed`;
      },
    },
  });

  const currentFilesCount = getSafeFilesArray().length;

  const previewMeta = useMemo(() => {
    if (!previewFile) return null;
    const meta = getFileMeta(previewFile.file);
    const size = getFileSize(previewFile.file);
    return { ...meta, size };
  }, [previewFile]);

  return (
    <>
      <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
        <FormControl
          fullWidth={fullWidth}
          required={required}
          error={Boolean(errorMessage)}
          disabled={disabled}
          variant="outlined"
          sx={sx}
        >
          <InputLabel
            shrink
            htmlFor={`${name}-upload`}
            sx={{
              px: 0.5,
              bgcolor: "background.paper",
            }}
          >
            {label}
          </InputLabel>

          <OutlinedInput
            id={`${name}-upload`}
            notched
            label={label}
            multiline
            value=" "
            onChange={() => {}}
            inputComponent={React.forwardRef<HTMLDivElement, any>(
              function UploadInput({ ...props }, ref) {
                return (
                  <Box
                    {...props}
                    ref={ref}
                    sx={{ display: "flex", flexDirection: "column", p: 0 }}
                  >
                    {/* ── DROP ZONE ── */}
                    <Box
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      sx={{
                        p: tokens.boxPadding,
                        opacity: disabled ? 0.6 : 1,
                        borderBottom:
                          previews.length > 0
                            ? `1px solid ${palette.containerBorder}`
                            : "none",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: tokens.gap,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box
                        onClick={handleUploadClick}
                        sx={{
                          cursor: disabled ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          flex: 1,
                          minWidth: 0,
                          borderRadius: 1,
                          py: 0.5,
                          "&:hover": {
                            bgcolor:
                              !disabled && !dragActive
                                ? palette.dropHoverBg
                                : undefined,
                          },
                        }}
                      >
                        {uploading ? (
                          <>
                            <CircularProgress
                              size={tokens.dropIconSize - 2}
                              thickness={4}
                              sx={{ color: palette.dropIconActive }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: tokens.countFontSize }}
                            >
                              {uploadProgress}%
                            </Typography>
                          </>
                        ) : (
                          <>
                            <CloudUpload
                              sx={{
                                fontSize: tokens.dropIconSize,
                                color: dragActive
                                  ? palette.dropIconActive
                                  : palette.dropIcon,
                              }}
                            />
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{
                                color: disabled
                                  ? palette.dropTextDisabled
                                  : palette.dropText,
                                fontWeight: 500,
                                fontSize: tokens.dropFontSize,
                              }}
                            >
                              {dragActive
                                ? "Drop files here"
                                : placeholder || "Upload documents"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: palette.dropIcon,
                                fontSize: tokens.countFontSize,
                              }}
                            >
                              ({currentFilesCount}/{maxFiles})
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* ── FILE LIST ── */}
                    {previews.length > 0 && (
                      <Box
                        sx={{
                          p: tokens.boxPadding,
                          bgcolor: palette.fileListBg,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: tokens.gap,
                          }}
                        >
                          <AnimatePresence>
                            {previews.map((item, index) => {
                              const meta = getFileMeta(item.file);
                              const sizeLabel = getFileSize(item.file);
                              const canPreview = isPreviewable(item.file);

                              return (
                                <motion.div
                                  key={`${item.url}-${index}`}
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: 40 }}
                                  transition={{ duration: 0.18 }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      px: 1,
                                      height: 30,
                                      boxSizing: "border-box",
                                      borderRadius: 1,
                                      bgcolor: palette.fileRowBg,
                                      transition: "all 0.2s",
                                      "&:hover": {
                                        boxShadow: palette.fileRowShadowHover,
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 1,
                                        bgcolor: alpha(meta.color, 0.1),
                                        color: meta.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        "& svg": {
                                          fontSize: tokens.fileIconSize - 6,
                                        },
                                      }}
                                    >
                                      {meta.icon}
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Tooltip
                                        title={meta.name}
                                        arrow
                                        placement="top-start"
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: "block",
                                            fontWeight: 600,
                                            fontSize: tokens.dropFontSize,
                                            color: palette.fileName,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            cursor: "default",
                                            lineHeight: 1.1,
                                          }}
                                        >
                                          {meta.name}
                                        </Typography>
                                      </Tooltip>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          gap: 1,
                                          alignItems: "center",
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontSize: tokens.countFontSize,
                                            color: meta.color,
                                            fontWeight: 700,
                                            letterSpacing: 0.5,
                                            lineHeight: 1.1,
                                          }}
                                        >
                                          {meta.label}
                                        </Typography>
                                        {sizeLabel && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontSize: tokens.countFontSize,
                                              color: palette.fileMeta,
                                              lineHeight: 1.1,
                                            }}
                                          >
                                            • {sizeLabel}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>

                                    {!disabled && (
                                      <Box
                                        sx={{
                                          display: "flex",
                                          gap: 0.75,
                                          flexShrink: 0,
                                          alignItems: "center",
                                          pl: 1,
                                          ml: 0.5,
                                          borderLeft: `1px solid ${palette.fileRowBorder}`,
                                        }}
                                      >
                                        {canPreview && (
                                          <Tooltip title="Preview" arrow>
                                            <IconButton
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenPreview(item);
                                              }}
                                              sx={{
                                                width: tokens.actionBtnSize,
                                                height: tokens.actionBtnSize,
                                                p: 0,
                                                borderRadius: 1,
                                                bgcolor: palette.previewBtnBg,
                                                "&:hover": {
                                                  bgcolor: alpha(
                                                    palette.previewBtnIcon,
                                                    0.18,
                                                  ),
                                                },
                                                transition: "all 0.15s ease",
                                              }}
                                            >
                                              <Visibility
                                                sx={{
                                                  fontSize: tokens.actionIconSize,
                                                  color: palette.previewBtnIcon,
                                                }}
                                              />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                        <Tooltip title="Remove" arrow>
                                          <IconButton
                                            size="small"
                                            onClick={(e) =>
                                              handleRemoveFile(index, e)
                                            }
                                            sx={{
                                              width: tokens.actionBtnSize,
                                              height: tokens.actionBtnSize,
                                              p: 0,
                                              borderRadius: 1,
                                              bgcolor: palette.deleteBtnBg,
                                              color: palette.deleteBtnIcon,
                                              border: "1px solid transparent",
                                              "&:hover": {
                                                bgcolor: alpha(
                                                  palette.deleteBtnIcon,
                                                  0.18,
                                                ),
                                                borderColor: palette.deleteBtnIcon,
                                              },
                                              transition: "all 0.15s ease",
                                            }}
                                          >
                                            <Delete
                                              sx={{
                                                fontSize: tokens.actionIconSize,
                                              }}
                                            />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    )}
                                  </Box>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              },
            )}
            sx={{
              p: 0,
              alignItems: "stretch",
              "& .MuiOutlinedInput-input": { p: 0 },
              "& fieldset": {
                borderColor: isDark
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(15,23,42,0.28)",
                borderWidth: 1.5,
              },
              "&:hover fieldset": {
                borderColor: disabled
                  ? undefined
                  : errorMessage
                    ? "error.main"
                    : isDark
                      ? "#ffffff"
                      : "#000000",
              },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
              ...(dragActive && {
                "& fieldset": { borderColor: "primary.main", borderWidth: 1.5 },
              }),
            }}
          />

          <FormHelperText sx={{ mx: 1.5, mt: 0.5 }}>
            {errorMessage || " "}
          </FormHelperText>
        </FormControl>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: "none" }}
        />
      </Box>

      {/* ───────── PREVIEW DIALOG ───────── */}
      <Dialog
        open={!!previewFile}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              width: "100%",
              maxWidth: { xs: "100vw", sm: "90vw" },
              maxHeight: { xs: "100vh", sm: "92vh" },
              m: { xs: 0, sm: 2 },
              overflow: "hidden",
              bgcolor: palette.dialogHeaderBg,
              border: `1px solid ${palette.dialogBorder}`,
              backgroundImage: "none",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 1.75, sm: 2.5 },
            bgcolor: palette.dialogHeaderBg,
            color: palette.dialogTitle,
            borderBottom: `1px solid ${palette.dialogBorder}`,
          }}
        >
          {previewMeta && (
            <>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: alpha(previewMeta.color, 0.1),
                  color: previewMeta.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {previewMeta.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.95rem", sm: "1.1rem" },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: palette.dialogTitle,
                  }}
                >
                  {previewMeta.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: palette.dialogText }}
                >
                  {previewMeta.label}
                  {previewMeta.size && ` • ${previewMeta.size}`}
                </Typography>
              </Box>
            </>
          )}
          <IconButton
            onClick={handleClosePreview}
            size="small"
            sx={{ color: palette.dialogText }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: palette.dialogPreviewBg,
            height: { xs: "calc(100vh - 152px)", sm: "65vh" },
            position: "relative",
          }}
        >
          {previewFile && isPDF(previewFile.file) && (
            <Box
              component="iframe"
              src={previewFile.url}
              title={getFileMeta(previewFile.file).name}
              sx={{ width: "100%", height: "100%", border: "none" }}
            />
          )}

          {previewFile && isImage(previewFile.file) && (
            <Box
              component="img"
              src={previewFile.url}
              alt={getFileMeta(previewFile.file).name}
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          )}

          {previewMeta &&
            !isPDF(previewFile!.file) &&
            !isImage(previewFile!.file) && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 2,
                    bgcolor: alpha(previewMeta.color, 0.1),
                    color: previewMeta.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "& svg": { fontSize: 56 },
                  }}
                >
                  {previewMeta.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: palette.dialogText, textAlign: "center" }}
                >
                  Preview not available for {previewMeta.label} files.
                  <br />
                  Download to view the content.
                </Typography>
              </Box>
            )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.75, sm: 2.5 },
            gap: 1.5,
            bgcolor: palette.dialogHeaderBg,
            borderTop: `1px solid ${palette.dialogBorder}`,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {previewFile && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              href={previewFile.url}
              download={getFileMeta(previewFile.file).name}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1,
                borderColor: palette.dialogBorder,
                color: palette.dialogTitle,
              }}
            >
              Download
            </Button>
          )}
          <Button
            onClick={handleClosePreview}
            variant="contained"
            startIcon={<Check />}
            disableElevation
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 4,
              py: 1,
              bgcolor: palette.doneBtnBg,
              color: theme.palette.primary.contrastText,
              boxShadow: "none",
              "&:hover": {
                bgcolor: palette.doneBtnHoverBg,
                boxShadow: "none",
              },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileUpload;
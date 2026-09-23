/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/immutability */
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
  Fade,
  Tooltip,
  type SxProps,
  type Theme,
  alpha,
  Grow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
} from "@mui/material";
import {
  Delete,
  CloudUpload,
  CheckCircle,
  Description as DescriptionIcon,
  PictureAsPdf,
  InsertDriveFile,
  TableChart,
  Slideshow,
  Close as CloseIcon,
  Check,
  Visibility,
  Download,
} from "@mui/icons-material";
import { useFormContext } from "react-hook-form";
import { showSnackbar } from "../MUI/ToastMessage";
import { motion, AnimatePresence } from "framer-motion";

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
    rowPadding: number;
    dropIconSize: number;
    dropFontSize: string;
    countFontSize: string;
    fileIconSize: number;
    actionBtnSize: number;   // ← renamed from actionIconSize (clearer)
    actionIconSize: number;
    gap: number;
  }
> = {
  small: {
    rowPadding: 1,
    dropIconSize: 18,
    dropFontSize: "0.7rem",
    countFontSize: "0.6rem",
    fileIconSize: 22,
    actionBtnSize: 26,       // ← was 32 fixed
    actionIconSize: 14,      // ← was 18 fixed
    gap: 0.75,
  },
  medium: {
    rowPadding: 1.5,
    dropIconSize: 22,
    dropFontSize: "0.8rem",
    countFontSize: "0.7rem",
    fileIconSize: 28,
    actionBtnSize: 32,
    actionIconSize: 16,
    gap: 1,
  },
  large: {
    rowPadding: 2,
    dropIconSize: 28,
    dropFontSize: "0.9rem",
    countFontSize: "0.8rem",
    fileIconSize: 34,
    actionBtnSize: 38,
    actionIconSize: 18,
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

const isPreviewable = (file: File | string): boolean => {
  return isPDF(file) || isImage(file);
};

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
  /* ────────────────────────────────────────────────────────── */
  /*  THEME — with safe fallback for apps without dark mode     */
  /* ────────────────────────────────────────────────────────── */
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  const tokens = SIZE_TOKENS[size];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formFiles = watch(name) as (File | string)[] | undefined;

  const [previews, setPreviews] = useState<
    { url: string; file: File | string }[]
  >([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    file: File | string;
  } | null>(null);

  const initialized = useRef(false);
  const errorMessage = errors[name]?.message as string;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  /* ────────────────────────────────────────────────────────── */
  /*  PALETTE                                                   */
  /* ────────────────────────────────────────────────────────── */
  const palette = useMemo(() => {
    const t = theme.palette;
    return {
      containerBg: t.background.paper,
      containerBorder: t.divider,
      containerBorderActive: t.primary.main,
      containerBorderError: t.error.main,
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
      fileRowBorder: t.divider,
      fileRowBorderHover: t.primary.main,
      fileRowShadowHover: isDark
        ? `0 2px 8px ${alpha(t.common.black, 0.4)}`
        : `0 2px 8px ${alpha(t.common.black, 0.08)}`,

      fileName: t.text.primary,
      fileMeta: t.text.secondary,

      previewBtnBg: alpha(t.primary.main, 0.08),
      previewBtnIcon: t.primary.main,

      deleteBtnBg: alpha(t.error.main, 0.08),
      deleteBtnIcon: t.error.main,

      successColor: t.success.main,

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

  const getSafeFilesArray = useCallback((): (File | string)[] => {
    if (!formFiles) return [];
    if (Array.isArray(formFiles)) return formFiles;
    return [];
  }, [formFiles]);

  const generatePreview = useCallback((file: string | File): string => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file;
  }, []);

  useEffect(() => {
    if (!defaultFiles || defaultFiles.length === 0) return;
    if (initialized.current) return;

    initialized.current = true;
    setValue(name, defaultFiles, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [defaultFiles, name, setValue]);

  useEffect(() => {
    const files = getSafeFilesArray();
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const items = files
      .filter((file) => file)
      .map((file) => ({
        url: generatePreview(file),
        file,
      }));

    setPreviews(items);

    return () => {
      items.forEach(({ url }) => {
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
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
      if (type.endsWith("/*")) {
        return fileType.startsWith(type.replace("/*", "/"));
      }
      if (fileType && fileType === type) return true;
      if (type.startsWith(".") && fileExt && fileExt === type) return true;
      if (!type.includes("/") && !type.startsWith(".") && fileExt) {
        return fileExt === `.${type}`;
      }
      return false;
    });

    if (!isTypeMatch) {
      return `${file.name}: Unsupported file format`;
    }
    return null;
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
      const currentFiles = getSafeFilesArray();
      const updatedFiles = [...currentFiles, ...files];
      setValue(name, updatedFiles, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [getSafeFilesArray, name, setValue],
  );

  const processFiles = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length === 0) return;

      const currentFiles = getSafeFilesArray();
      const availableSlots = maxFiles - currentFiles.length;

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
      } catch (error) {
        console.error("Upload error:", error);
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
      const newFiles = Array.from(files);
      const { valid, errors } = validateFiles(newFiles);

      if (errors.length > 0) {
        showSnackbar("error", errors[0]);
        event.target.value = "";
        return;
      }

      if (valid.length > 0) {
        await processFiles(valid);
      }

      event.target.value = "";
    },
    [disabled, validateFiles, processFiles],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
    },
    [],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      if (disabled) return;

      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) return;

      const { valid, errors } = validateFiles(files);
      if (errors.length > 0) {
        showSnackbar("error", errors[0]);
        return;
      }
      if (valid.length > 0) await processFiles(valid);
    },
    [disabled, validateFiles, processFiles],
  );

  const handleRemoveFile = useCallback(
    (index: number, e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();

      const currentFiles = getSafeFilesArray();
      const removed = currentFiles[index];

      if (typeof removed === "string") {
        setDeletedFiles((prev) => [...prev, removed]);
      }

      const updatedFiles = currentFiles.filter((_, i) => i !== index);

      setValue(name, updatedFiles, {
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
    if (deletedFiles.length === 0) return;
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
      <Box sx={{ width: fullWidth ? "100%" : "auto", ...sx }}>
        {label && (
          <Typography
            variant="caption"
            component="label"
            sx={{
              display: "block",
              fontWeight: 600,
              fontSize: "0.75rem",
              mb: 0.75,
              color: disabled ? "text.disabled" : "text.primary",
            }}
          >
            {label}
            {required && (
              <Typography
                component="span"
                sx={{ color: "error.main", ml: 0.3, fontSize: "0.75rem" }}
              >
                *
              </Typography>
            )}
          </Typography>
        )}

        <Paper
          variant="outlined"
          sx={{
            border: `1.5px solid ${
              dragActive
                ? palette.containerBorderActive
                : errorMessage
                  ? palette.containerBorderError
                  : palette.containerBorder
            }`,
            borderRadius: 1,
            bgcolor: dragActive
              ? palette.containerBgDrag
              : disabled
                ? palette.containerBgDisabled
                : palette.containerBg,
            transition: "all 0.2s",
            overflow: "hidden",
          }}
        >
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: tokens.rowPadding,
              opacity: disabled ? 0.6 : 1,
              borderBottom:
                previews.length > 0
                  ? `1px solid ${palette.containerBorder}`
                  : "none",
              transition: "all 0.2s",
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
                borderRadius: 1,
                py: 1,
                "&:hover": {
                  bgcolor:
                    !disabled && !dragActive ? palette.dropHoverBg : undefined,
                },
              }}
            >
              {uploading ? (
                <>
                  <CircularProgress
                    size={tokens.dropIconSize}
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

          {previews.length > 0 && (
            <Grow in={true}>
              <Box sx={{ p: tokens.rowPadding, bgcolor: palette.fileListBg }}>
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
                              p: 1,
                              borderRadius: 1,
                              border: `1px solid ${palette.fileRowBorder}`,
                              bgcolor: palette.fileRowBg,
                              transition: "all 0.2s",
                              "&:hover": {
                                borderColor: palette.fileRowBorderHover,
                                boxShadow: palette.fileRowShadowHover,
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: tokens.fileIconSize + 8,
                                height: tokens.fileIconSize + 8,
                                borderRadius: 1,
                                bgcolor: alpha(meta.color, 0.1),
                                color: meta.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                "& svg": { fontSize: tokens.fileIconSize },
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
                                  mt: 0.2,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: tokens.countFontSize,
                                    color: meta.color,
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
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
          bgcolor: alpha(palette.previewBtnIcon, 0.18),
        },
        transition: "all 0.15s ease",
      }}
    >
      <Visibility
        sx={{ fontSize: tokens.actionIconSize, color: palette.previewBtnIcon }}
      />
    </IconButton>
  </Tooltip>
)}
                              <Tooltip title="Remove" arrow>
  <IconButton
    size="small"
    onClick={(e) => handleRemoveFile(index, e)}
    sx={{
      width: tokens.actionBtnSize,
      height: tokens.actionBtnSize,
      p: 0,
      borderRadius: 1,
      bgcolor: palette.deleteBtnBg,
      color: palette.deleteBtnIcon,
      border: `1px solid transparent`,
      "&:hover": {
        bgcolor: alpha(palette.deleteBtnIcon, 0.18),
        borderColor: palette.deleteBtnIcon,
      },
      transition: "all 0.15s ease",
    }}
  >
    <Delete sx={{ fontSize: tokens.actionIconSize }} />
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

                {!uploading && previews.length > 0 && (
                  <Fade in={true}>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <CheckCircle
                        sx={{ fontSize: 10, color: palette.successColor }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: palette.successColor,
                          fontSize: "0.6rem",
                        }}
                      >
                        {previews.length} document(s) ready • Max {maxSizeMB}MB
                        per file
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Grow>
          )}
        </Paper>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: "none" }}
        />

        {errorMessage && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              ml: 1,
              color: "error.main",
              fontSize: "0.65rem",
            }}
          >
            {errorMessage}
          </Typography>
        )}
      </Box>

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
            height: { xs: "calc(100vh - 152px)", sm: "72vh" },
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
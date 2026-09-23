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
  Fade,
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
  CameraAlt,
  Check,
  CheckCircle,
  Close as CloseIcon,
  CloudUpload,
  Crop,
  Delete,
  FlipCameraIos,
  Image as ImageIcon,
  Replay,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { compressMultipleImages } from "../../utils/imageCompressor";
import { showSnackbar } from "../MUI/ToastMessage";

/* ═══════════════════════════════════════════════════════════════
 *  TYPES & CONSTANTS
 * ═══════════════════════════════════════════════════════════════ */

type UploadSize = "small" | "medium" | "large";
type HandleType =
  | "n" | "s" | "e" | "w"
  | "nw" | "ne" | "sw" | "se"
  | "move" | null;

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PhotoUploadProps {
  name: string;
  maxFiles?: number;
  label?: string;
  placeholder?: string;
  defaultPhotos?: (string | File)[];
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  showCompressionInfo?: boolean;
  maxSizeMB?: number;
  targetSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  compress?: boolean;
  cropEnabled?: boolean;
  cropAspect?: number;
  cameraEnabled?: boolean;
  size?: UploadSize;
}

type FormValues = Record<string, unknown>;

const CROP_ACCENT = "#FF5722";
const CROP_ACCENT_HOVER = "#e64a19";

const SIZE_TOKENS: Record<
  UploadSize,
  {
    previewSize: number;
    boxPadding: number;
    dropIconSize: number;
    dropFontSize: string;
    countFontSize: string;
    cameraBtnSize: number;
    cameraIconSize: number;
    deleteBtnSize: number;
    deleteIconSize: number;
    gap: number;
  }
> = {
  small: {
    previewSize: 22, boxPadding: 1, dropIconSize: 15,
    dropFontSize: "0.65rem", countFontSize: "0.55rem",
    cameraBtnSize: 24, cameraIconSize: 14,
    deleteBtnSize: 18, deleteIconSize: 11, gap: 0.75,
  },
  medium: {
    previewSize: 28, boxPadding: 1.5, dropIconSize: 18,
    dropFontSize: "0.7rem", countFontSize: "0.6rem",
    cameraBtnSize: 30, cameraIconSize: 16,
    deleteBtnSize: 22, deleteIconSize: 13, gap: 1,
  },
  large: {
    previewSize: 40, boxPadding: 2, dropIconSize: 22,
    dropFontSize: "0.85rem", countFontSize: "0.7rem",
    cameraBtnSize: 38, cameraIconSize: 20,
    deleteBtnSize: 30, deleteIconSize: 16, gap: 1.25,
  },
};

/* ═══════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════ */

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  name,
  label,
  placeholder,
  maxFiles = 5,
  defaultPhotos = [],
  accept = "image/jpeg,image/png,image/jpg,image/webp",
  required = false,
  disabled = false,
  fullWidth = true,
  sx,
  showCompressionInfo = false,
  maxSizeMB = 10,
  targetSizeKB = 100,
  maxWidth,
  maxHeight,
  compress = true,
  cropEnabled = false,
  cropAspect = undefined,
  cameraEnabled = true,
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

  const formPhotos = watch(name) as (File | string)[] | undefined;
  const errorMessage = errors[name]?.message as string | undefined;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  /* ── refs ── */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialized = useRef(false);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropStageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragState = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);

  /* ── state ── */
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [renderedSize, setRenderedSize] = useState({
    w: 0, h: 0, left: 0, top: 0,
  });
  const [cropBox, setCropBox] = useState<CropBox>({
    x: 0, y: 0, width: 0, height: 0,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  /* ═══════════════════════════════════════════════════════════
   *  PALETTE (memoized)
   * ═══════════════════════════════════════════════════════════ */
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

      previewGridBg: isDark
        ? alpha(t.common.white, 0.015)
        : alpha(t.common.black, 0.008),
      previewTileBg: isDark ? alpha(t.common.white, 0.02) : "#ffffff",
      previewTileBorder: isDark
        ? "rgba(255,255,255,0.18)"
        : "rgba(15,23,42,0.22)",
      previewTileBorderHover: isDark ? "#ffffff" : "#000000",
      previewTileShadowHover: isDark
        ? `0 2px 8px ${alpha(t.common.black, 0.4)}`
        : `0 2px 8px ${alpha(t.common.black, 0.08)}`,
      imagePlaceholder: isDark
        ? alpha(t.common.white, 0.15)
        : alpha(t.common.black, 0.15),

      deleteBadgeBg: t.background.paper,
      deleteBadgeHoverBg: alpha(t.error.main, 0.12),
      deleteBadgeIcon: t.error.main,

      addTileBg: isDark
        ? alpha(t.common.white, 0.02)
        : alpha(t.common.black, 0.015),
      addTileBorder: t.divider,
      addTileHoverBg: alpha(t.primary.main, 0.06),
      addTileHoverBorder: t.primary.main,
      addTileIcon: t.text.disabled,

      successColor: t.success.main,

      lightboxBg: alpha(t.common.black, isDark ? 0.95 : 0.92),
      lightboxCloseBg: t.background.paper,
      lightboxCloseHover: alpha(t.primary.main, 0.12),
      lightboxCloseIcon: t.text.primary,

      dialogHeaderBg: t.background.paper,
      dialogBorder: t.divider,
      dialogTitle: t.text.primary,
      dialogText: t.text.secondary,

      cropAccent: CROP_ACCENT,
      cropAccentHover: CROP_ACCENT_HOVER,
    };
  }, [theme, isDark]);

  /* ═══════════════════════════════════════════════════════════
   *  DATA HELPERS
   * ═══════════════════════════════════════════════════════════ */
  const getSafePhotosArray = useCallback(
    (): (File | string)[] =>
      Array.isArray(formPhotos) ? formPhotos : [],
    [formPhotos],
  );

  const generatePreview = useCallback(
    (photo: string | File): string =>
      photo instanceof File ? URL.createObjectURL(photo) : photo,
    [],
  );

  /* ── default photos seeding ── */
  useEffect(() => {
    if (initialized.current) return;
    if (!defaultPhotos?.length) return;
    initialized.current = true;
    setValue(name, defaultPhotos, { shouldValidate: false, shouldDirty: false });
    const urls = defaultPhotos.filter(Boolean).map(generatePreview).filter(Boolean);
    setPreviews(urls);
  }, [defaultPhotos, name, setValue, generatePreview]);

  /* ── preview list sync ── */
  useEffect(() => {
    const photos = getSafePhotosArray();
    if (!photos.length) {
      setPreviews([]);
      return;
    }
    const urls = photos.filter(Boolean).map(generatePreview).filter(Boolean);
    setPreviews(urls);
    return () => {
      urls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [getSafePhotosArray, generatePreview]);

  /* ═══════════════════════════════════════════════════════════
   *  VALIDATION
   * ═══════════════════════════════════════════════════════════ */
  const validateImageDimensions = useCallback(
    (file: File): Promise<{ valid: boolean; error?: string }> =>
      new Promise((resolve) => {
        if (file.type === "image/svg+xml") return resolve({ valid: true });

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (maxWidth && img.width > maxWidth) {
            return resolve({
              valid: false,
              error: `Image width is ${img.width}px. Maximum allowed width is ${maxWidth}px`,
            });
          }
          if (maxHeight && img.height > maxHeight) {
            return resolve({
              valid: false,
              error: `Image height is ${img.height}px. Maximum allowed height is ${maxHeight}px`,
            });
          }
          resolve({ valid: true });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({
            valid: false,
            error: "Could not read image dimensions. File may be corrupted or invalid format.",
          });
        };
        img.src = objectUrl;
      }),
    [maxWidth, maxHeight],
  );

  const validateFiles = useCallback(
    async (files: File[]): Promise<{ valid: File[]; errors: string[] }> => {
      const valid: File[] = [];
      const errors: string[] = [];
      for (const file of files) {
        if (file.size > maxSizeBytes) {
          errors.push(`${file.name}: Max ${maxSizeMB}MB file allowed`);
        } else if (!accept.split(",").includes(file.type)) {
          errors.push(`${file.name}: Unsupported file format`);
        } else {
          const check = await validateImageDimensions(file);
          if (!check.valid && check.error) {
            errors.push(`${file.name}: ${check.error}`);
          } else {
            valid.push(file);
          }
        }
      }
      return { valid, errors };
    },
    [maxSizeBytes, maxSizeMB, accept, validateImageDimensions],
  );

  /* ═══════════════════════════════════════════════════════════
   *  CROP LOGIC
   * ═══════════════════════════════════════════════════════════ */
  const initCropBox = useCallback(
    (dispW: number, dispH: number) => {
      let w = dispW;
      let h = dispH;
      if (cropAspect) {
        if (w / h > cropAspect) w = h * cropAspect;
        else h = w / cropAspect;
      }
      setCropBox({
        x: (dispW - w) / 2,
        y: (dispH - h) / 2,
        width: w,
        height: h,
      });
    },
    [cropAspect],
  );

  const computeRenderedLayout = useCallback(() => {
    const stage = cropStageRef.current;
    const img = cropImgRef.current;
    if (!stage || !img || !naturalSize.w || !naturalSize.h) return;

    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    if (!stageW || !stageH) return;

    const imgRatio = naturalSize.w / naturalSize.h;
    const stageRatio = stageW / stageH;
    let dispW: number, dispH: number;

    if (imgRatio > stageRatio) {
      dispW = stageW;
      dispH = stageW / imgRatio;
    } else {
      dispH = stageH;
      dispW = stageH * imgRatio;
    }

    setRenderedSize({
      w: dispW,
      h: dispH,
      left: (stageW - dispW) / 2,
      top: (stageH - dispH) / 2,
    });
    initCropBox(dispW, dispH);
  }, [naturalSize, initCropBox]);

  useEffect(() => {
    if (!cropDialogOpen || !imageLoaded) return;
    computeRenderedLayout();
    const onResize = () => computeRenderedLayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [cropDialogOpen, imageLoaded, computeRenderedLayout]);

  const clampBox = useCallback(
    (box: CropBox, dispW: number, dispH: number): CropBox => {
      const minSize = Math.min(dispW, dispH) * 0.05;
      let { x, y, width, height } = box;
      width = Math.min(Math.max(width, minSize), dispW);
      height = Math.min(Math.max(height, minSize), dispH);
      x = Math.max(0, Math.min(x, dispW - width));
      y = Math.max(0, Math.min(y, dispH - height));
      return { x, y, width, height };
    },
    [],
  );

  const applyEdgeDelta = useCallback(
    (
      handle: HandleType,
      startBox: CropBox,
      dx: number,
      dy: number,
      dispW: number,
      dispH: number,
    ): CropBox => {
      const box = { ...startBox };
      if (handle === "move") {
        box.x = startBox.x + dx;
        box.y = startBox.y + dy;
        return clampBox(box, dispW, dispH);
      }

      const right = startBox.x + startBox.width;
      const bottom = startBox.y + startBox.height;
      const minSize = Math.min(dispW, dispH) * 0.05;

      let newLeft = startBox.x;
      let newRight = right;
      let newTop = startBox.y;
      let newBottom = bottom;

      switch (handle) {
        case "e": newRight = right + dx; break;
        case "w": newLeft = startBox.x + dx; break;
        case "s": newBottom = bottom + dy; break;
        case "n": newTop = startBox.y + dy; break;
        case "ne": newRight = right + dx; newTop = startBox.y + dy; break;
        case "nw": newLeft = startBox.x + dx; newTop = startBox.y + dy; break;
        case "se": newRight = right + dx; newBottom = bottom + dy; break;
        case "sw": newLeft = startBox.x + dx; newBottom = bottom + dy; break;
      }

      if (newRight - newLeft < minSize) {
        if (handle === "e" || handle === "ne" || handle === "se") newRight = newLeft + minSize;
        else newLeft = newRight - minSize;
      }
      if (newBottom - newTop < minSize) {
        if (handle === "s" || handle === "sw" || handle === "se") newBottom = newTop + minSize;
        else newTop = newBottom - minSize;
      }

      box.x = newLeft;
      box.y = newTop;
      box.width = newRight - newLeft;
      box.height = newBottom - newTop;

      if (box.x < 0) box.x = 0;
      if (box.y < 0) box.y = 0;
      if (box.x + box.width > dispW) box.width = dispW - box.x;
      if (box.y + box.height > dispH) box.height = dispH - box.y;

      if (cropAspect) {
        if (handle === "e" || handle === "w") {
          let newHeight = box.width / cropAspect;
          if (box.y + newHeight > dispH) {
            newHeight = dispH - box.y;
            box.width = newHeight * cropAspect;
          }
          box.height = newHeight;
          box.y = startBox.y + (startBox.height - newHeight) / 2;
        } else if (handle === "n" || handle === "s") {
          let newWidth = box.height * cropAspect;
          if (box.x + newWidth > dispW) {
            newWidth = dispW - box.x;
            box.height = newWidth / cropAspect;
          }
          box.width = newWidth;
          box.x = startBox.x + (startBox.width - newWidth) / 2;
        } else {
          let newHeight = box.width / cropAspect;
          if (handle === "ne" || handle === "nw") {
            if (bottom - newHeight < 0) {
              newHeight = bottom;
              box.width = newHeight * cropAspect;
            }
            box.y = bottom - newHeight;
          } else {
            if (startBox.y + newHeight > dispH) {
              newHeight = dispH - startBox.y;
              box.width = newHeight * cropAspect;
            }
            box.y = startBox.y;
          }
          box.height = newHeight;
        }
      }
      return clampBox(box, dispW, dispH);
    },
    [cropAspect, clampBox],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const ds = dragState.current;
      if (!ds) return;
      const next = applyEdgeDelta(
        ds.handle,
        ds.startBox,
        clientX - ds.startX,
        clientY - ds.startY,
        renderedSize.w,
        renderedSize.h,
      );
      setCropBox(next);
    },
    [renderedSize, applyEdgeDelta],
  );

  const mouseMoveHandler = useCallback(
    (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY),
    [handlePointerMove],
  );

  const touchMoveHandler = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length) {
        e.preventDefault();
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handlePointerMove],
  );

  const stopDrag = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("mousemove", mouseMoveHandler);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", touchMoveHandler);
    window.removeEventListener("touchend", stopDrag);
  }, [mouseMoveHandler, touchMoveHandler]);

  const startDrag = useCallback(
    (handle: HandleType, clientX: number, clientY: number) => {
      dragState.current = {
        handle,
        startX: clientX,
        startY: clientY,
        startBox: { ...cropBox },
      };
      window.addEventListener("mousemove", mouseMoveHandler);
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchmove", touchMoveHandler, { passive: false });
      window.addEventListener("touchend", stopDrag);
    },
    [cropBox, mouseMoveHandler, stopDrag, touchMoveHandler],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", touchMoveHandler);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [mouseMoveHandler, stopDrag, touchMoveHandler]);

  const onHandleMouseDown = useCallback(
    (handle: HandleType) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(handle, e.clientX, e.clientY);
    },
    [startDrag],
  );

  const onHandleTouchStart = useCallback(
    (handle: HandleType) => (e: React.TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length) startDrag(handle, e.touches[0].clientX, e.touches[0].clientY);
    },
    [startDrag],
  );

  const getCroppedImage = useCallback(
    async (imageSrc: string, box: CropBox, dispW: number, dispH: number): Promise<File> => {
      const image = new Image();
      image.src = imageSrc;
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const scaleX = image.naturalWidth / dispW;
      const scaleY = image.naturalHeight / dispH;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(box.width * scaleX);
      canvas.height = Math.round(box.height * scaleY);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(
          image,
          box.x * scaleX,
          box.y * scaleY,
          box.width * scaleX,
          box.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(new File([blob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.95,
        );
      });
    },
    [],
  );

  const resetCropDialogState = useCallback(() => {
    setCropDialogOpen(false);
    setTempFile(null);
    setCropImageSrc("");
    setImageLoaded(false);
    setNaturalSize({ w: 0, h: 0 });
    setCropBox({ x: 0, y: 0, width: 0, height: 0 });
  }, []);

  /* ═══════════════════════════════════════════════════════════
   *  ADD / REMOVE
   * ═══════════════════════════════════════════════════════════ */
  const addFilesToForm = useCallback(
    (files: File[]) => {
      const updated = [...getSafePhotosArray(), ...files];
      setValue(name, updated, { shouldValidate: true, shouldDirty: true });
    },
    [getSafePhotosArray, name, setValue],
  );

  const handleCropConfirm = useCallback(async () => {
    if (!cropImageSrc || !renderedSize.w || !renderedSize.h) return;
    try {
      const croppedFile = await getCroppedImage(
        cropImageSrc, cropBox, renderedSize.w, renderedSize.h,
      );
      addFilesToForm([croppedFile]);
      showSnackbar("success", "Image cropped and uploaded successfully");
      resetCropDialogState();
    } catch (err) {
      console.error("Crop error:", err);
      showSnackbar("error", "Failed to crop image");
    }
  }, [cropImageSrc, cropBox, renderedSize, getCroppedImage, addFilesToForm, resetCropDialogState]);

  const handleSkipCrop = useCallback(() => {
    if (tempFile) {
      addFilesToForm([tempFile]);
      showSnackbar("success", "Image uploaded successfully");
    }
    resetCropDialogState();
  }, [tempFile, addFilesToForm, resetCropDialogState]);

  const openCropDialog = useCallback((file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setTempFile(file);
      setImageLoaded(false);
      setCropDialogOpen(true);
    };
  }, []);

  const onCropImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImageLoaded(true);
    },
    [],
  );

  const processFiles = useCallback(
    async (files: File[]): Promise<void> => {
      if (!files.length) return;

      for (const file of files) {
        const check = await validateImageDimensions(file);
        if (!check.valid) {
          showSnackbar("error", check.error || `Invalid dimensions for ${file.name}`);
          return;
        }
      }

      const availableSlots = maxFiles - getSafePhotosArray().length;
      if (availableSlots <= 0) {
        showSnackbar("warning", `Maximum ${maxFiles} images only allowed`);
        return;
      }

      const filesToAdd = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
        showSnackbar("warning", `Maximum ${maxFiles} images only allowed`);
      }

      if (cropEnabled && filesToAdd.length) {
        openCropDialog(filesToAdd[0]);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        setUploadProgress(30);
        const processed = compress
          ? await compressMultipleImages(filesToAdd, {
              maxWidth: 1280, maxHeight: 1280, quality: 0.82, maxSizeKB: targetSizeKB,
            })
          : filesToAdd;
        addFilesToForm(processed);
        setUploadProgress(100);
        showSnackbar(
          "success",
          `${processed.length} image(s) uploaded${compress ? " and compressed" : ""}`,
        );
      } catch (err) {
        console.error("Compression error:", err);
        showSnackbar(
          "error",
          compress ? "Failed to compress images" : "Failed to upload images",
        );
      } finally {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 300);
      }
    },
    [
      getSafePhotosArray, maxFiles, targetSizeKB, validateImageDimensions,
      compress, cropEnabled, openCropDialog, addFilesToForm,
    ],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || disabled) return;
      const { valid, errors } = await validateFiles(Array.from(files));
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
      const { valid, errors } = await validateFiles(files);
      if (errors.length) {
        showSnackbar("error", errors[0]);
        return;
      }
      if (valid.length) await processFiles(valid);
    },
    [disabled, validateFiles, processFiles],
  );

  const handleRemovePhoto = useCallback(
    (index: number, e: React.MouseEvent): void => {
      e.stopPropagation();
      const current = getSafePhotosArray();
      const removed = current[index];

      if (typeof removed === "string") {
        setDeletedPhotos((prev) => [...prev, removed]);
      }

      setValue(name, current.filter((_, i) => i !== index), {
        shouldValidate: true,
        shouldDirty: true,
      });

      const fileName = removed instanceof File
        ? removed.name
        : typeof removed === "string"
          ? removed.split("/").pop()?.split("?")[0] || "Image"
          : "Image";

      showSnackbar("error", `${fileName} deleted`);
    },
    [getSafePhotosArray, name, setValue],
  );

  const handleUploadClick = useCallback((): void => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleEnlargeImage = useCallback((src: string) => setEnlargedImage(src), []);
  const handleCloseEnlarged = useCallback(() => setEnlargedImage(null), []);

  useEffect(() => {
    if (!deletedPhotos.length) return;
    setValue("deletedPhotos", deletedPhotos as unknown, { shouldDirty: true });
  }, [deletedPhotos, setValue]);

  register(name, {
    required: required
      ? `${label || placeholder || "Image"} is required`
      : false,
    validate: {
      maxFiles: (value) => {
        const arr = value as (File | string)[] | undefined;
        if (!arr) return true;
        return arr.length <= maxFiles || `Maximum ${maxFiles} images allowed`;
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
   *  CAMERA
   * ═══════════════════════════════════════════════════════════ */
  const stopCameraStream = useCallback(() => {
    setCameraStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const startCameraStream = useCallback(
    async (mode: "user" | "environment") => {
      try {
        stopCameraStream();
        if (!navigator.mediaDevices?.getUserMedia) {
          showSnackbar("error", "Camera API is not supported. Please use a modern browser over HTTPS.");
          setCameraOpen(false);
          return;
        }

        const attempts: MediaStreamConstraints[] = [
          {
            video: {
              facingMode: mode === "environment" ? { ideal: "environment" } : { ideal: "user" },
              width: { ideal: 1280 }, height: { ideal: 720 },
            },
            audio: false,
          },
          { video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: { facingMode: mode }, audio: false },
          { video: true, audio: false },
        ];

        let stream: MediaStream | null = null;
        for (const c of attempts) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(c);
            if (stream) break;
          } catch (err) {
            console.warn("Camera attempt failed:", c, err);
          }
        }

        if (!stream) {
          showSnackbar("error", "Unable to access camera. Please check permissions and close other apps using the camera.");
          setCameraOpen(false);
          return;
        }

        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (err) {
            console.warn("Video play error:", err);
          }
        }
      } catch (err) {
        console.error("Camera error:", err);
        showSnackbar("error", "Unable to access camera. Please check permissions.");
        setCameraOpen(false);
      }
    },
    [stopCameraStream],
  );

  const handleOpenCamera = useCallback(() => {
    if (disabled) return;
    if (getSafePhotosArray().length >= maxFiles) {
      showSnackbar("warning", `Maximum ${maxFiles} images only allowed`);
      return;
    }
    setCapturedImage(null);
    setCameraOpen(true);
    setFacingMode("environment");
    startCameraStream("environment");
  }, [disabled, getSafePhotosArray, maxFiles, startCameraStream]);

  const handleCloseCamera = useCallback(() => {
    stopCameraStream();
    setCameraOpen(false);
    setCapturedImage(null);
  }, [stopCameraStream]);

  const handleFlipCamera = useCallback(async () => {
    if (isSwitching) return;
    const nextMode = facingMode === "user" ? "environment" : "user";
    setIsSwitching(true);
    setFacingMode(nextMode);
    showSnackbar("info", `Switching to ${nextMode === "environment" ? "back" : "front"} camera...`);
    try {
      await startCameraStream(nextMode);
    } catch (err) {
      console.error("Failed to switch camera:", err);
      showSnackbar("error", "Failed to access camera after switching");
      setCameraOpen(false);
    } finally {
      setIsSwitching(false);
    }
  }, [facingMode, startCameraStream, isSwitching]);

  const handleCapturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.95));
  }, [facingMode]);

  const handleRetakePhoto = useCallback(() => setCapturedImage(null), []);

  const handleUseCapturedPhoto = useCallback(() => {
    if (!capturedImage) return;
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCameraStream();
        setCameraOpen(false);
        setCapturedImage(null);
        if (cropEnabled) {
          openCropDialog(file);
        } else {
          addFilesToForm([file]);
          showSnackbar("success", "Photo captured and uploaded successfully");
        }
      })
      .catch(() => showSnackbar("error", "Failed to process captured photo"));
  }, [capturedImage, stopCameraStream, cropEnabled, openCropDialog, addFilesToForm]);

  useEffect(() => () => stopCameraStream(), [stopCameraStream]);

  /* ═══════════════════════════════════════════════════════════
   *  RENDER
   * ═══════════════════════════════════════════════════════════ */
  const currentFilesCount = getSafePhotosArray().length;
  const PREVIEW_SIZE = tokens.previewSize;

  const renderHandle = (
    handle: HandleType,
    style: React.CSSProperties,
    cursor: string,
  ) => (
    <Box
      onMouseDown={onHandleMouseDown(handle)}
      onTouchStart={onHandleTouchStart(handle)}
      sx={{ position: "absolute", cursor, touchAction: "none", zIndex: 5, ...style }}
    />
  );

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
                  !disabled && !dragActive ? palette.dropHoverBg : undefined,
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
                  {dragActive ? "Drop here" : placeholder || "Upload images"}
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

          {cameraEnabled && !uploading && (
            <Tooltip title="Take a photo" arrow>
              <span>
                <IconButton
                  onClick={handleOpenCamera}
                  disabled={disabled || currentFilesCount >= maxFiles}
                  size="small"
                  sx={{
                    bgcolor: alpha(palette.dropIconActive, 0.08),
                    width: tokens.cameraBtnSize,
                    height: tokens.cameraBtnSize,
                    "&:hover": {
                      bgcolor: alpha(palette.dropIconActive, 0.15),
                    },
                  }}
                >
                  <CameraAlt
                    sx={{
                      fontSize: tokens.cameraIconSize,
                      color: palette.dropIconActive,
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        {/* ── PREVIEW LIST ── */}
        {previews.length > 0 && (
          <Box sx={{ p: tokens.boxPadding, bgcolor: palette.previewGridBg }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: tokens.gap,
                alignItems: "center",
              }}
            >
              <AnimatePresence>
                {previews.map((img, index) => (
                  <motion.div
                    key={`${img}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        p: 0.5,
                        borderRadius: 1,
                        border: `1px solid ${palette.previewTileBorder}`,
                        bgcolor: palette.previewTileBg,
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: palette.previewTileBorderHover,
                          boxShadow: palette.previewTileShadowHover,
                        },
                      }}
                    >
                      <Tooltip title="Click to enlarge" arrow>
                        <Box
                          sx={{
                            position: "relative",
                            width: PREVIEW_SIZE,
                            height: PREVIEW_SIZE,
                            borderRadius: 0.5,
                            overflow: "hidden",
                            cursor: "pointer",
                            bgcolor: palette.previewTileBg,
                            flexShrink: 0,
                          }}
                          onClick={() => handleEnlargeImage(img)}
                        >
                          {img ? (
                            <Box
                              component="img"
                              src={img}
                              alt={`Preview ${index + 1}`}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ImageIcon
                                sx={{
                                  fontSize: 14,
                                  color: palette.imagePlaceholder,
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Tooltip>

                      {!disabled && (
                        <Tooltip title="Remove" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(index, e);
                            }}
                            sx={{
                              width: tokens.deleteBtnSize,
                              height: tokens.deleteBtnSize,
                              p: 0,
                              flexShrink: 0,
                              bgcolor: palette.deleteBadgeBg,
                              color: palette.deleteBadgeIcon,
                              transition: "all 0.15s ease",
                              "&:hover": {
                                bgcolor: palette.deleteBadgeHoverBg,
                              },
                            }}
                          >
                            <Delete sx={{ fontSize: tokens.deleteIconSize }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!disabled &&
                currentFilesCount < maxFiles &&
                currentFilesCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Box
                      onClick={handleUploadClick}
                      sx={{
                        width: PREVIEW_SIZE + 14,
                        height: PREVIEW_SIZE + 8,
                        borderRadius: 1,
                        border: `1px dashed ${palette.addTileBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        bgcolor: palette.addTileBg,
                        "&:hover": {
                          borderColor: palette.addTileHoverBorder,
                          bgcolor: palette.addTileHoverBg,
                        },
                      }}
                    >
                      <CloudUpload
                        sx={{
                          fontSize: Math.max(10, tokens.dropIconSize - 6),
                          color: palette.addTileIcon,
                        }}
                      />
                    </Box>
                  </motion.div>
                )}
            </Box>

            {showCompressionInfo && !uploading && previews.length > 0 && (
              <Fade in>
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
                    Optimized (&lt;{targetSizeKB}KB)
                  </Typography>
                </Box>
              </Fade>
            )}
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

      {/* ───────── LIGHTBOX ───────── */}
      <AnimatePresence>
        {enlargedImage && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: palette.lightboxBg,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
            onClick={handleCloseEnlarged}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ position: "relative" }}
            >
              <Box
                component="img"
                src={enlargedImage}
                alt="Enlarged view"
                sx={{
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  borderRadius: 2,
                  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
                }}
              />
              <Tooltip title="Close" arrow>
                <IconButton
                  onClick={handleCloseEnlarged}
                  sx={{
                    position: "absolute",
                    top: { xs: -44, sm: -50 },
                    right: { xs: 0, sm: -50 },
                    bgcolor: palette.lightboxCloseBg,
                    width: 36,
                    height: 36,
                    "&:hover": { bgcolor: palette.lightboxCloseHover },
                    boxShadow: 2,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 18, color: palette.lightboxCloseIcon }} />
                </IconButton>
              </Tooltip>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* ───────── CROP DIALOG ───────── */}
      <Dialog
        open={cropDialogOpen}
        onClose={resetCropDialogState}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: 0, sm: 4 },
              bgcolor: "#000",
              width: "100%",
              height: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100vw", sm: "90vw" },
              maxHeight: { xs: "100vh", sm: "92vh" },
              m: { xs: 0, sm: 2 },
              overflow: "hidden",
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
          <Crop sx={{ color: palette.cropAccent, fontSize: 26 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" }, color: palette.dialogTitle }}
          >
            Crop Image
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: palette.dialogText,
              ml: "auto",
              display: { xs: "none", sm: "block" },
            }}
          >
            Drag any edge or corner independently
          </Typography>
          <IconButton
            onClick={resetCropDialogState}
            size="small"
            sx={{ color: palette.dialogText, display: { xs: "flex", sm: "none" } }}
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
            bgcolor: "#111",
            height: { xs: "calc(100vh - 152px)", sm: "72vh" },
            position: "relative",
          }}
        >
          {cropImageSrc && (
            <Box
              ref={cropStageRef}
              sx={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: renderedSize.left,
                  top: renderedSize.top,
                  width: renderedSize.w,
                  height: renderedSize.h,
                }}
              >
                <Box
                  component="img"
                  ref={cropImgRef}
                  src={cropImageSrc}
                  onLoad={onCropImageLoad}
                  alt="Crop source"
                  draggable={false}
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "contain",
                    pointerEvents: "none",
                  }}
                />

                {imageLoaded && (
                  <>
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(
                          to right,
                          rgba(0,0,0,0.6) 0,
                          rgba(0,0,0,0.6) ${cropBox.x}px,
                          transparent ${cropBox.x}px,
                          transparent ${cropBox.x + cropBox.width}px,
                          rgba(0,0,0,0.6) ${cropBox.x + cropBox.width}px,
                          rgba(0,0,0,0.6) 100%
                        )`,
                        pointerEvents: "none",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        left: cropBox.x,
                        top: 0,
                        width: cropBox.width,
                        height: cropBox.y,
                        bgcolor: "rgba(0,0,0,0.6)",
                        pointerEvents: "none",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        left: cropBox.x,
                        top: cropBox.y + cropBox.height,
                        width: cropBox.width,
                        height: renderedSize.h - (cropBox.y + cropBox.height),
                        bgcolor: "rgba(0,0,0,0.6)",
                        pointerEvents: "none",
                      }}
                    />

                    <Box
                      onMouseDown={onHandleMouseDown("move")}
                      onTouchStart={onHandleTouchStart("move")}
                      sx={{
                        position: "absolute",
                        left: cropBox.x,
                        top: cropBox.y,
                        width: cropBox.width,
                        height: cropBox.height,
                        border: `2px solid ${palette.cropAccent}`,
                        boxSizing: "border-box",
                        cursor: "move",
                        touchAction: "none",
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.3)",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gridTemplateRows: "1fr 1fr 1fr",
                          pointerEvents: "none",
                        }}
                      >
                        {Array.from({ length: 9 }).map((_, i) => (
                          <Box key={i} sx={{ border: "1px solid rgba(255,255,255,0.35)" }} />
                        ))}
                      </Box>
                    </Box>

                    {renderHandle("n", { left: cropBox.x + cropBox.width / 2 - 16, top: cropBox.y - 6, width: 32, height: 12, borderRadius: 4, backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "ns-resize")}
                    {renderHandle("s", { left: cropBox.x + cropBox.width / 2 - 16, top: cropBox.y + cropBox.height - 6, width: 32, height: 12, borderRadius: 4, backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "ns-resize")}
                    {renderHandle("e", { left: cropBox.x + cropBox.width - 6, top: cropBox.y + cropBox.height / 2 - 16, width: 12, height: 32, borderRadius: 4, backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "ew-resize")}
                    {renderHandle("w", { left: cropBox.x - 6, top: cropBox.y + cropBox.height / 2 - 16, width: 12, height: 32, borderRadius: 4, backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "ew-resize")}
                    {renderHandle("nw", { left: cropBox.x - 10, top: cropBox.y - 10, width: 20, height: 20, borderRadius: "50%", backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "nwse-resize")}
                    {renderHandle("ne", { left: cropBox.x + cropBox.width - 10, top: cropBox.y - 10, width: 20, height: 20, borderRadius: "50%", backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "nesw-resize")}
                    {renderHandle("sw", { left: cropBox.x - 10, top: cropBox.y + cropBox.height - 10, width: 20, height: 20, borderRadius: "50%", backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "nesw-resize")}
                    {renderHandle("se", { left: cropBox.x + cropBox.width - 10, top: cropBox.y + cropBox.height - 10, width: 20, height: 20, borderRadius: "50%", backgroundColor: palette.cropAccent, border: "2px solid #fff" }, "nwse-resize")}
                  </>
                )}
              </Box>

              {!imageLoaded && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress sx={{ color: palette.cropAccent }} />
                </Box>
              )}
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
          <Button
            onClick={handleSkipCrop}
            variant="text"
            sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1, color: palette.dialogText }}
          >
            Skip Crop
          </Button>
          <Button
            onClick={resetCropDialogState}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              py: 1,
              borderColor: palette.dialogBorder,
              color: palette.dialogTitle,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropConfirm}
            variant="contained"
            startIcon={<Check />}
            disabled={!imageLoaded}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 4,
              py: 1,
              bgcolor: palette.cropAccent,
              color: "#fff",
              "&:hover": { bgcolor: palette.cropAccentHover },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            Confirm Crop
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───────── CAMERA DIALOG ───────── */}
      <Dialog
        open={cameraOpen}
        onClose={handleCloseCamera}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: 0, sm: 4 },
              bgcolor: "#000",
              width: "100%",
              height: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100vw", sm: "600px" },
              maxHeight: { xs: "100vh", sm: "92vh" },
              m: { xs: 0, sm: 2 },
              overflow: "hidden",
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
          <CameraAlt sx={{ color: palette.cropAccent, fontSize: 26 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" }, color: palette.dialogTitle }}
          >
            Take Photo
          </Typography>
          <IconButton
            onClick={handleCloseCamera}
            size="small"
            sx={{ ml: "auto", color: palette.dialogText }}
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
            bgcolor: "#000",
            height: { xs: "calc(100vh - 152px)", sm: "65vh" },
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
          ) : (
            <Box
              component="img"
              src={capturedImage}
              alt="Captured"
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!capturedImage && cameraStream && (
            <IconButton
              onClick={handleFlipCamera}
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                bgcolor: alpha(theme.palette.common.white, 0.9),
                "&:hover": { bgcolor: theme.palette.common.white },
              }}
            >
              <FlipCameraIos
                sx={{
                  color: isDark ? theme.palette.common.black : theme.palette.text.primary,
                }}
              />
            </IconButton>
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
          {!capturedImage ? (
            <Button
              onClick={handleCapturePhoto}
              variant="contained"
              startIcon={<CameraAlt />}
              disabled={!cameraStream}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 4,
                py: 1,
                bgcolor: palette.cropAccent,
                color: "#fff",
                "&:hover": { bgcolor: palette.cropAccentHover },
              }}
            >
              Capture
            </Button>
          ) : (
            <>
              <Button
                onClick={handleRetakePhoto}
                variant="outlined"
                startIcon={<Replay />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  borderColor: palette.dialogBorder,
                  color: palette.dialogTitle,
                }}
              >
                Retake
              </Button>
              <Button
                onClick={handleUseCapturedPhoto}
                variant="contained"
                startIcon={<Check />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 4,
                  py: 1,
                  bgcolor: palette.cropAccent,
                  color: "#fff",
                  "&:hover": { bgcolor: palette.cropAccentHover },
                }}
              >
                Use Photo
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PhotoUpload;
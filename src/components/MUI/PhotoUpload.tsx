/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/immutability */
import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "@mui/material";
import {
  Delete,
  CloudUpload,
  CheckCircle,
  Image as ImageIcon,
  Close as CloseIcon,
  Check,
  Crop,
  CameraAlt,
  FlipCameraIos,
  Replay,
} from "@mui/icons-material";
import { useFormContext } from "react-hook-form";
import { compressMultipleImages } from "../../utils/imageCompressor";
import { showSnackbar } from "../MUI/ToastMessage";
import { motion, AnimatePresence } from "framer-motion";

type UploadSize = "small" | "medium" | "large";

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

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandleType = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se" | "move" | null;


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
    gap: number;
  }
> = {
  small: {
    previewSize: 22,
    boxPadding: 1,
    dropIconSize: 15,
    dropFontSize: "0.65rem",
    countFontSize: "0.55rem",
    cameraBtnSize: 24,
    cameraIconSize: 14,
    gap: 0.75,
  },
  medium: {
    previewSize: 28,
    boxPadding: 1.5,
    dropIconSize: 18,
    dropFontSize: "0.7rem",
    countFontSize: "0.6rem",
    cameraBtnSize: 30,
    cameraIconSize: 16,
    gap: 1,
  },
  large: {
    previewSize: 40,
    boxPadding: 2,
    dropIconSize: 22,
    dropFontSize: "0.85rem",
    countFontSize: "0.7rem",
    cameraBtnSize: 38,
    cameraIconSize: 20,
    gap: 1.25,
  },
};

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
  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  const tokens = SIZE_TOKENS[size];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formPhotos = watch(name) as (File | string)[] | undefined;

  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const initialized = useRef(false);

  const [cropDialogOpen, setCropDialogOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [tempFile, setTempFile] = useState<File | null>(null);

  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropStageRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [renderedSize, setRenderedSize] = useState<{ w: number; h: number; left: number; top: number }>({
    w: 0,
    h: 0,
    left: 0,
    top: 0,
  });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const dragState = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const [cameraOpen, setCameraOpen] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const errorMessage = errors[name]?.message as string;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const getSafePhotosArray = useCallback((): (File | string)[] => {
    if (!formPhotos) return [];
    if (Array.isArray(formPhotos)) return formPhotos;
    return [];
  }, [formPhotos]);

  const generatePreview = useCallback((photo: string | File): string => {
    if (photo instanceof File) {
      return URL.createObjectURL(photo);
    }
    return photo;
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    if (!defaultPhotos || defaultPhotos.length === 0) return;

    initialized.current = true;
    setValue(name, defaultPhotos, {
      shouldValidate: false,
      shouldDirty: false,
    });

    const urls = defaultPhotos
      .filter((photo) => photo)
      .map((photo) => generatePreview(photo))
      .filter((url) => url);

    setPreviews(urls);
  }, [defaultPhotos, name, setValue, generatePreview]);

  useEffect(() => {
    const photos = getSafePhotosArray();
    if (!photos || photos.length === 0) {
      setPreviews([]);
      return;
    }

    const urls = photos
      .filter((photo) => photo)
      .map((photo) => generatePreview(photo))
      .filter((url) => url);

    setPreviews(urls);

    return () => {
      urls.forEach((url) => {
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [getSafePhotosArray, generatePreview]);

  const validateImageDimensions = useCallback(
    (file: File): Promise<{ valid: boolean; error?: string }> => {
      return new Promise((resolve) => {
        if (file.type === "image/svg+xml") {
          resolve({ valid: true });
          return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);

          if (maxWidth && img.width > maxWidth) {
            resolve({
              valid: false,
              error: `Image width is ${img.width}px. Maximum allowed width is ${maxWidth}px`,
            });
          } else if (maxHeight && img.height > maxHeight) {
            resolve({
              valid: false,
              error: `Image height is ${img.height}px. Maximum allowed height is ${maxHeight}px`,
            });
          } else {
            resolve({ valid: true });
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({
            valid: false,
            error: `Could not read image dimensions. File may be corrupted or invalid format.`,
          });
        };

        img.src = objectUrl;
      });
    },
    [maxWidth, maxHeight]
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
          const dimensionCheck = await validateImageDimensions(file);
          if (!dimensionCheck.valid && dimensionCheck.error) {
            errors.push(`${file.name}: ${dimensionCheck.error}`);
          } else {
            valid.push(file);
          }
        }
      }
      return { valid, errors };
    },
    [maxSizeBytes, maxSizeMB, accept, validateImageDimensions]
  );

 const initCropBox = useCallback(
  (dispW: number, dispH: number) => {
    let w = dispW;
    let h = dispH;

    if (cropAspect) {
      if (w / h > cropAspect) {
        w = h * cropAspect;
      } else {
        h = w / cropAspect;
      }
    }

    const x = (dispW - w) / 2;
    const y = (dispH - h) / 2;

    setCropBox({ x, y, width: w, height: h });
  },
  [cropAspect]
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

    let dispW: number;
    let dispH: number;

    if (imgRatio > stageRatio) {
      dispW = stageW;
      dispH = stageW / imgRatio;
    } else {
      dispH = stageH;
      dispW = stageH * imgRatio;
    }

    const left = (stageW - dispW) / 2;
    const top = (stageH - dispH) / 2;

    setRenderedSize({ w: dispW, h: dispH, left, top });
    initCropBox(dispW, dispH);
  }, [naturalSize, initCropBox]);

  useEffect(() => {
    if (!cropDialogOpen || !imageLoaded) return;
    computeRenderedLayout();

    const handleResize = () => computeRenderedLayout();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
  []
);

 
 const applyEdgeDelta = useCallback(
  (handle: HandleType, startBox: CropBox, dx: number, dy: number, dispW: number, dispH: number): CropBox => {
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
      if (handle === "e" || handle === "ne" || handle === "se") {
        newRight = newLeft + minSize;
      } else {
        newLeft = newRight - minSize;
      }
    }
    if (newBottom - newTop < minSize) {
      if (handle === "s" || handle === "sw" || handle === "se") {
        newBottom = newTop + minSize;
      } else {
        newTop = newBottom - minSize;
      }
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
  [cropAspect, clampBox]
);

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const ds = dragState.current;
      if (!ds) return;

      const dx = clientX - ds.startX;
      const dy = clientY - ds.startY;
      const dispW = renderedSize.w;
      const dispH = renderedSize.h;

      const next = applyEdgeDelta(ds.handle, ds.startBox, dx, dy, dispW, dispH);
      setCropBox(next);
    },
    [renderedSize, applyEdgeDelta]
  );

  const stopDrag = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("mousemove", mouseMoveHandler);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", touchMoveHandler);
    window.removeEventListener("touchend", stopDrag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mouseMoveHandler = useCallback(
    (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    },
    [handlePointerMove]
  );

  const touchMoveHandler = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handlePointerMove]
  );

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
    [cropBox, mouseMoveHandler, stopDrag, touchMoveHandler]
  );

  const onHandleMouseDown = useCallback(
    (handle: HandleType) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(handle, e.clientX, e.clientY);
    },
    [startDrag]
  );

  const onHandleTouchStart = useCallback(
    (handle: HandleType) => (e: React.TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length > 0) {
        startDrag(handle, e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [startDrag]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", touchMoveHandler);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [mouseMoveHandler, stopDrag, touchMoveHandler]);

  const getCroppedImage = useCallback(
    async (imageSrc: string, box: CropBox, dispW: number, dispH: number): Promise<File> => {
      const image = new Image();
      image.src = imageSrc;
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const scaleX = image.naturalWidth / dispW;
      const scaleY = image.naturalHeight / dispH;

      const sx = box.x * scaleX;
      const sy = box.y * scaleY;
      const sw = box.width * scaleX;
      const sh = box.height * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      }

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `cropped_${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              resolve(file);
            }
          },
          "image/jpeg",
          0.95
        );
      });
    },
    []
  );

  const resetCropDialogState = useCallback(() => {
    setCropDialogOpen(false);
    setTempFile(null);
    setCropImageSrc("");
    setImageLoaded(false);
    setNaturalSize({ w: 0, h: 0 });
    setCropBox({ x: 0, y: 0, width: 0, height: 0 });
  }, []);

  const addFilesToForm = useCallback(
    (files: File[]) => {
      const currentFiles = getSafePhotosArray();
      const updatedFiles = [...currentFiles, ...files];
      setValue(name, updatedFiles, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [getSafePhotosArray, name, setValue]
  );

  const handleCropConfirm = useCallback(async () => {
    if (!cropImageSrc || !renderedSize.w || !renderedSize.h) return;

    try {
      const croppedFile = await getCroppedImage(cropImageSrc, cropBox, renderedSize.w, renderedSize.h);
      addFilesToForm([croppedFile]);
      showSnackbar("success", "Image cropped and uploaded successfully");
      resetCropDialogState();
    } catch (error) {
      console.error("Crop error:", error);
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

  const onCropImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImageLoaded(true);
  }, []);

  const processFiles = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length === 0) return;

      for (const file of files) {
        const dimensionCheck = await validateImageDimensions(file);
        if (!dimensionCheck.valid) {
          showSnackbar("error", dimensionCheck.error || `Invalid dimensions for ${file.name}`);
          return;
        }
      }

      const currentFiles = getSafePhotosArray();
      const availableSlots = maxFiles - currentFiles.length;
      if (availableSlots <= 0) {
        showSnackbar("warning", `Maximum ${maxFiles} images only allowed`);
        return;
      }

      const filesToAdd = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
        showSnackbar("warning", `Maximum ${maxFiles} images only allowed`);
      }

      if (cropEnabled && filesToAdd.length > 0) {
        openCropDialog(filesToAdd[0]);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        setUploadProgress(30);
                     let processedFiles;
        if (compress) {
                   processedFiles = await compressMultipleImages(filesToAdd, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.82,
            maxSizeKB: targetSizeKB,
          });
        } else {
          processedFiles = filesToAdd;
        }
        addFilesToForm(processedFiles);
        setUploadProgress(100);
        showSnackbar("success", `${processedFiles.length} image(s) uploaded${compress ? " and compressed" : ""}`);
      } catch (error) {
        console.error("Compression error:", error);
        showSnackbar("error", compress ? "Failed to compress images" : "Failed to upload images");
      } finally {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 300);
      }
    },
    [getSafePhotosArray, maxFiles, targetSizeKB, validateImageDimensions, compress, cropEnabled, openCropDialog, addFilesToForm]
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || disabled) return;
      const newFiles = Array.from(files);
      const { valid, errors } = await validateFiles(newFiles);

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
    [disabled, validateFiles, processFiles]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) setDragActive(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      if (disabled) return;
      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) return;
      const { valid, errors } = await validateFiles(files);
      if (errors.length > 0) {
        showSnackbar("error", errors[0]);
        return;
      }
      if (valid.length > 0) await processFiles(valid);
    },
    [disabled, validateFiles, processFiles]
  );

  const handleRemovePhoto = useCallback(
    (index: number, e: React.MouseEvent): void => {
      e.stopPropagation();

      const currentFiles = getSafePhotosArray();
      const removed = currentFiles[index];

      if (typeof removed === "string") {
        setDeletedPhotos((prev) => [...prev, removed]);
      }

      const updatedFiles = currentFiles.filter((_, i) => i !== index);

      setValue(name, updatedFiles, {
        shouldValidate: true,
        shouldDirty: true,
      });

      let fileName = "Image";

      if (removed instanceof File) {
        fileName = removed.name;
      } else if (typeof removed === "string") {
        fileName = removed.split("/").pop()?.split("?")[0] || "Image";
      }

      showSnackbar("error", `${fileName} deleted`);
    },
    [getSafePhotosArray, name, setValue]
  );

  const handleUploadClick = useCallback((): void => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleEnlargeImage = useCallback((src: string) => setEnlargedImage(src), []);
  const handleCloseEnlarged = useCallback(() => setEnlargedImage(null), []);

  useEffect(() => {
    if (deletedPhotos.length === 0) return;
    setValue("deletedPhotos", deletedPhotos as unknown, { shouldDirty: true });
  }, [deletedPhotos, setValue]);

  register(name, {
    required: required ? `${label || placeholder || "Image"} is required` : false,
    validate: {
      maxFiles: (value) => {
        const arr = value as (File | string)[] | undefined;
        if (!arr) return true;
        return arr.length <= maxFiles || `Maximum ${maxFiles} images allowed`;
      },
    },
  });

  const stopCameraStream = useCallback(() => {
    setCameraStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

 const startCameraStream = useCallback(
  async (mode: "user" | "environment") => {
    try {
      stopCameraStream();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showSnackbar(
          "error",
          "Camera API is not supported. Please use a modern browser over HTTPS.",
        );
        setCameraOpen(false);
        return;
      }

      let stream: MediaStream | null = null;

      const attempts: Array<MediaStreamConstraints> = [
        {
          video: {
            facingMode: mode === "environment" ? { ideal: "environment" } : { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: { facingMode: mode },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          console.warn("Camera attempt failed:", constraints, err);
        }
      }

      if (!stream) {
        showSnackbar(
          "error",
          "Unable to access camera. Please check permissions and close other apps using the camera.",
        );
        setCameraOpen(false);
        return;
      }

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play error:", playErr);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      showSnackbar(
        "error",
        "Unable to access camera. Please check permissions.",
      );
      setCameraOpen(false);
    }
  },
  [stopCameraStream],
);

const handleOpenCamera = useCallback(() => {
  if (disabled) return;
  const currentFiles = getSafePhotosArray();
  if (currentFiles.length >= maxFiles) {
    showSnackbar("warning", `Maximum ${maxFiles} images only allowed`);
    return;
  }
  setCapturedImage(null);
  setCameraOpen(true);
  const initialMode = "environment";
  setFacingMode(initialMode);
  startCameraStream(initialMode);
}, [disabled, getSafePhotosArray, maxFiles, startCameraStream]);

  const handleCloseCamera = useCallback(() => {
    stopCameraStream();
    setCameraOpen(false);
    setCapturedImage(null);
  }, [stopCameraStream]);

const [isSwitching, setIsSwitching] = useState(false);

const handleFlipCamera = useCallback(async () => {
  if (isSwitching) return; // Prevent rapid switching
  
  const nextMode = facingMode === "user" ? "environment" : "user";
  setIsSwitching(true);
  setFacingMode(nextMode);
  showSnackbar("info", `Switching to ${nextMode === 'environment' ? 'back' : 'front'} camera...`);
  
  try {
    await startCameraStream(nextMode);
  } catch (error) {
    console.error("Failed to switch camera:", error);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }, 
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      showSnackbar("warning", "Using any available camera");
    } catch {
      showSnackbar("error", "Failed to access camera after switching");
      setCameraOpen(false);
    }
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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(dataUrl);
  }, [facingMode]);

  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

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
      .catch(() => {
        showSnackbar("error", "Failed to process captured photo");
      });
  }, [capturedImage, stopCameraStream, cropEnabled, openCropDialog, addFilesToForm]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const currentFilesCount = getSafePhotosArray().length;
  const PREVIEW_SIZE = tokens.previewSize;

  const renderHandle = (handle: HandleType, style: React.CSSProperties, cursor: string) => (
    <Box
      onMouseDown={onHandleMouseDown(handle)}
      onTouchStart={onHandleTouchStart(handle)}
      sx={{
        position: "absolute",
        cursor,
        touchAction: "none",
        zIndex: 5,
        ...style,
      }}
    />
  );

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
              <Typography component="span" sx={{ color: "error.main", ml: 0.3, fontSize: "0.75rem" }}>
                *
              </Typography>
            )}
          </Typography>
        )}

        <Paper
          variant="outlined"
          sx={{
            border: `1.5px solid ${dragActive ? "#1976d2" : errorMessage ? "#dc2626" : "#e2e8f0"}`,
            borderRadius: 1,
            bgcolor: dragActive ? alpha("#1976d2", 0.02) : disabled ? alpha("#000", 0.02) : "#fff",
            transition: "all 0.2s",
            overflow: "hidden",
          }}
        >
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: tokens.boxPadding,
              opacity: disabled ? 0.6 : 1,
              borderBottom: previews.length > 0 ? "1px solid #e2e8f0" : "none",
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
                  bgcolor: !disabled && !dragActive ? alpha("#1976d2", 0.02) : undefined,
                },
              }}
            >
              {uploading ? (
                <>
                  <CircularProgress size={tokens.dropIconSize - 2} thickness={4} sx={{ color: "#1976d2" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: tokens.countFontSize }}>
                    {uploadProgress}%
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: tokens.dropIconSize, color: dragActive ? "#1976d2" : "#94a3b8" }} />
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      color: disabled ? "text.disabled" : "text.secondary",
                      fontWeight: 500,
                      fontSize: tokens.dropFontSize,
                    }}
                  >
                    {dragActive ? "Drop here" : placeholder || "Upload images"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: tokens.countFontSize }}>
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
                      bgcolor: alpha("#1976d2", 0.08),
                      width: tokens.cameraBtnSize,
                      height: tokens.cameraBtnSize,
                      "&:hover": { bgcolor: alpha("#1976d2", 0.15) },
                    }}
                  >
                    <CameraAlt sx={{ fontSize: tokens.cameraIconSize, color: "#1976d2" }} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          {previews.length > 0 && (
            <Grow in={true}>
              <Box sx={{ p: tokens.boxPadding, bgcolor: alpha("#f8fafc", 0.5) }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: tokens.gap, alignItems: "center" }}>
                  <AnimatePresence>
                    {previews.map((img, index) => (
                      <motion.div
                        key={`${img}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Tooltip title="Click to enlarge" arrow>
                          <Box
                            sx={{
                              position: "relative",
                              width: PREVIEW_SIZE,
                              height: PREVIEW_SIZE,
                              borderRadius: 1,
                              overflow: "hidden",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                              bgcolor: "#fff",
                              "&:hover": {
                                transform: "scale(1.1)",
                                borderColor: "#1976d2",
                                boxShadow: 1,
                              },
                            }}
                            onClick={() => handleEnlargeImage(img)}
                          >
                            {img ? (
                              <Box
                                component="img"
                                src={img}
                                alt={`Preview ${index + 1}`}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                                <ImageIcon sx={{ fontSize: 14, color: "#cbd5e1" }} />
                              </Box>
                            )}
                            {!disabled && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhoto(index, e);
                                }}
                                sx={{
                                  position: "absolute",
                                  top: -6,
                                  right: -6,
                                  bgcolor: "white",
                                  width: 18,
                                  height: 18,
                                  p: 0,
                                  "&:hover": { bgcolor: "#fee2e2" },
                                  boxShadow: 1,
                                  zIndex: 2,
                                }}
                              >
                                <Delete sx={{ fontSize: 10, color: "#dc2626" }} />
                              </IconButton>
                            )}
                          </Box>
                        </Tooltip>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {!disabled && currentFilesCount < maxFiles && currentFilesCount > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                      <Box
                        onClick={handleUploadClick}
                        sx={{
                          width: PREVIEW_SIZE,
                          height: PREVIEW_SIZE,
                          borderRadius: 1,
                          border: "1px dashed #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          bgcolor: "#fafafa",
                          "&:hover": {
                            borderColor: "#1976d2",
                            bgcolor: alpha("#1976d2", 0.04),
                          },
                        }}
                      >
                        <CloudUpload sx={{ fontSize: Math.max(10, tokens.dropIconSize - 6), color: "#94a3b8" }} />
                      </Box>
                    </motion.div>
                  )}
                </Box>
                {showCompressionInfo && !uploading && previews.length > 0 && (
                  <Fade in={true}>
                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CheckCircle sx={{ fontSize: 10, color: "#16a34a" }} />
                      <Typography variant="caption" sx={{ color: "#16a34a", fontSize: "0.6rem" }}>
                        Optimized (&lt;{targetSizeKB}KB)
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
            sx={{ display: "block", mt: 0.5, ml: 1, color: "error.main", fontSize: "0.65rem" }}
          >
            {errorMessage}
          </Typography>
        )}
      </Box>

      <AnimatePresence>
        {enlargedImage && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0,0,0,0.92)",
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
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                }}
              />
              <Tooltip title="Close" arrow>
                <IconButton
                  onClick={handleCloseEnlarged}
                  sx={{
                    position: "absolute",
                    top: { xs: -44, sm: -50 },
                    right: { xs: 0, sm: -50 },
                    bgcolor: "white",
                    width: 36,
                    height: 36,
                    "&:hover": { bgcolor: "#f1f5f9" },
                    boxShadow: 2,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      <Dialog
        open={cropDialogOpen}
        onClose={resetCropDialogState}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper:{
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
        }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 1.75, sm: 2.5 },
            bgcolor: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Crop sx={{ color: "#FF5722", fontSize: 26 }} />
          <Typography
  variant="h6"
  sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" } }}
>
  Crop Image
</Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: "auto", display: { xs: "none", sm: "block" } }}
          >
            Drag any edge or corner independently
          </Typography>
          <IconButton onClick={resetCropDialogState} size="small" sx={{ display: { xs: "flex", sm: "none" } }}>
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
                        border: "2px solid #FF5722",
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
                          <Box
                            key={i}
                            sx={{
                              border: "1px solid rgba(255,255,255,0.35)",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {renderHandle(
                      "n",
                      {
                        left: cropBox.x + cropBox.width / 2 - 16,
                        top: cropBox.y - 6,
                        width: 32,
                        height: 12,
                        borderRadius: 4,
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "ns-resize"
                    )}
                    {renderHandle(
                      "s",
                      {
                        left: cropBox.x + cropBox.width / 2 - 16,
                        top: cropBox.y + cropBox.height - 6,
                        width: 32,
                        height: 12,
                        borderRadius: 4,
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "ns-resize"
                    )}
                    {renderHandle(
                      "e",
                      {
                        left: cropBox.x + cropBox.width - 6,
                        top: cropBox.y + cropBox.height / 2 - 16,
                        width: 12,
                        height: 32,
                        borderRadius: 4,
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "ew-resize"
                    )}
                    {renderHandle(
                      "w",
                      {
                        left: cropBox.x - 6,
                        top: cropBox.y + cropBox.height / 2 - 16,
                        width: 12,
                        height: 32,
                        borderRadius: 4,
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "ew-resize"
                    )}

                    {renderHandle(
                      "nw",
                      {
                        left: cropBox.x - 10,
                        top: cropBox.y - 10,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "nwse-resize"
                    )}
                    {renderHandle(
                      "ne",
                      {
                        left: cropBox.x + cropBox.width - 10,
                        top: cropBox.y - 10,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "nesw-resize"
                    )}
                    {renderHandle(
                      "sw",
                      {
                        left: cropBox.x - 10,
                        top: cropBox.y + cropBox.height - 10,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "nesw-resize"
                    )}
                    {renderHandle(
                      "se",
                      {
                        left: cropBox.x + cropBox.width - 10,
                        top: cropBox.y + cropBox.height - 10,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#FF5722",
                        border: "2px solid #fff",
                      },
                      "nwse-resize"
                    )}
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
                  <CircularProgress sx={{ color: "#FF5722" }} />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.75, sm: 2.5 },
            gap: 1.5,
            bgcolor: "#fff",
            borderTop: "1px solid #e2e8f0",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={handleSkipCrop}
            variant="text"
            sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1, color: "text.secondary" }}
          >
            Skip Crop
          </Button>
          <Button
            onClick={resetCropDialogState}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1 }}
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
              bgcolor: "#FF5722",
              "&:hover": { bgcolor: "#e64a19" },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            Confirm Crop
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cameraOpen}
        onClose={handleCloseCamera}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper:{
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
        }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 1.75, sm: 2.5 },
            bgcolor: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <CameraAlt sx={{ color: "#FF5722", fontSize: 26 }} />
         <Typography
  variant="h6"
  sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" } }}
>
  Take Photo
</Typography>
          <IconButton onClick={handleCloseCamera} size="small" sx={{ ml: "auto" }}>
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
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "#fff" },
              }}
            >
              <FlipCameraIos sx={{ color: "#333" }} />
            </IconButton>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.75, sm: 2.5 },
            gap: 1.5,
            bgcolor: "#fff",
            borderTop: "1px solid #e2e8f0",
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
                bgcolor: "#FF5722",
                "&:hover": { bgcolor: "#e64a19" },
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
                sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1 }}
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
                  bgcolor: "#FF5722",
                  "&:hover": { bgcolor: "#e64a19" },
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
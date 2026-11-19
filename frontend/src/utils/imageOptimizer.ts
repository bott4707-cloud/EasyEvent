/**
 * EasyEvent Image Compression & Optimization Utility
 * 
 * Compresses and resizes images client-side before uploading to Supabase Storage.
 * Generates modern WebP format where supported, maintains aspect ratio, and enforces
 * file type & size limits.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0 (default 0.82)
  maxFileSizeBytes?: number; // default 15MB
}

export interface OptimizedImageResult {
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  format: string;
  savingsPercent: number;
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.82,
  maxFileSizeBytes: 15 * 1024 * 1024, // 15MB
};

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
];

/**
 * Validates file type and size.
 */
export function validateImageFile(file: File, maxSizeBytes = DEFAULT_OPTIONS.maxFileSizeBytes): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  // Type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) && !file.type.startsWith("image/")) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || "unknown"}). Please upload a JPEG, PNG, or WebP photo.`,
    };
  }

  // Size validation
  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and resizes an image file using an HTML Canvas.
 * Automatically selects WebP format for optimal compression with JPEG fallback.
 */
export async function optimizeImage(
  file: File,
  options?: ImageOptimizationOptions
): Promise<OptimizedImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const validation = validateImageFile(file, opts.maxFileSizeBytes);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate constrained dimensions preserving aspect ratio
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const widthRatio = opts.maxWidth / width;
        const heightRatio = opts.maxHeight / height;
        const scale = Math.min(widthRatio, heightRatio);

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      // Create high-quality canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not initialize canvas context for image optimization."));
        return;
      }

      // Smooth downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Try modern WebP first
      let targetMime = "image/webp";
      let dataUrl = canvas.toDataURL(targetMime, opts.quality);

      // Fallback check if browser didn't encode as webp
      if (!dataUrl.startsWith("data:image/webp")) {
        targetMime = "image/jpeg";
        dataUrl = canvas.toDataURL(targetMime, opts.quality);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not create compressed image blob."));
            return;
          }

          const originalSize = file.size;
          const optimizedSize = blob.size;
          const savingsPercent = Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100));

          resolve({
            dataUrl,
            blob,
            originalSize,
            optimizedSize,
            width,
            height,
            format: targetMime,
            savingsPercent,
          });
        },
        targetMime,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load and decode image file."));
    };

    img.src = objectUrl;
  });
}

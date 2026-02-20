"use client";

import { useRef } from "react";

interface PhotoCaptureProps {
  onAnalyze: (base64: string, mediaType: string) => void;
  loading: boolean;
  imagePreview: string | null;
}

function compressImage(file: File, maxWidth = 1536): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const [header, base64] = dataUrl.split(",");
      const mediaType = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
      resolve({ base64, mediaType });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function PhotoCapture({
  onAnalyze,
  loading,
  imagePreview,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64, mediaType } = await compressImage(file);
      onAnalyze(base64, mediaType);
    } catch {
      // Fallback to raw file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const [header, base64] = dataUrl.split(",");
        const mediaType = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
        onAnalyze(base64, mediaType);
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 px-6 py-4 text-lg font-medium text-white active:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:active:bg-zinc-200"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analyzing...
          </span>
        ) : imagePreview ? (
          "Take Another Photo"
        ) : (
          "Snap Wine List"
        )}
      </button>

      {imagePreview && (
        <div className="w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Wine list photo"
            className="w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

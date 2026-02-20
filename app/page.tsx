"use client";

import { useState } from "react";
import PhotoCapture from "@/components/PhotoCapture";
import WineResults from "@/components/WineResults";
import type { Wine, WineType } from "@/lib/claude";

const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "red", label: "Red" },
  { value: "white", label: "White" },
  { value: "rose", label: "Rosé" },
  { value: "sparkling", label: "Sparkling" },
];

export default function Home() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [wineType, setWineType] = useState<WineType>("all");
  const [lastImage, setLastImage] = useState<{ base64: string; mediaType: string } | null>(null);

  async function analyze(base64: string, mediaType: string, type: WineType) {
    setLoading(true);
    setError(null);
    setWines([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType, wineType: type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze wine list");
      }

      setWines(data.wines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleAnalyze(base64: string, mediaType: string) {
    setImagePreview(`data:${mediaType};base64,${base64}`);
    setLastImage({ base64, mediaType });
    analyze(base64, mediaType, wineType);
  }

  function handleFilterChange(type: WineType) {
    setWineType(type);
    if (lastImage) {
      analyze(lastImage.base64, lastImage.mediaType, type);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Wine List
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Snap a photo of a wine menu for instant tasting notes
        </p>
      </header>

      <div className="flex gap-2">
        {WINE_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            disabled={loading}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              wineType === value
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:active:bg-zinc-700"
            } disabled:opacity-50`}
          >
            {label}
          </button>
        ))}
      </div>

      <PhotoCapture
        onAnalyze={handleAnalyze}
        loading={loading}
        imagePreview={imagePreview}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <WineResults wines={wines} />
    </main>
  );
}

"use client";

import { useState } from "react";
import PhotoCapture from "@/components/PhotoCapture";
import WineResults from "@/components/WineResults";
import type { Wine } from "@/lib/claude";

export default function Home() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function handleAnalyze(base64: string, mediaType: string) {
    setLoading(true);
    setError(null);
    setWines([]);
    setImagePreview(`data:${mediaType};base64,${base64}`);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze wine list");
      }

      setWines(data.wines);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
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

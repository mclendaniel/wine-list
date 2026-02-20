"use client";

import type { Wine } from "@/lib/claude";

interface WineResultsProps {
  wines: Wine[];
}

export default function WineResults({ wines }: WineResultsProps) {
  if (wines.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {wines.length} wine{wines.length !== 1 && "s"} found
      </h2>

      <div className="flex flex-col gap-3">
        {wines.map((wine, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                {wine.name}
              </h3>
              <span className="shrink-0 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {wine.price}
              </span>
            </div>

            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {wine.regionNotes}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {wine.tastingNotes.map(({ descriptor, rating }) => (
                <span
                  key={descriptor}
                  className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <span
                    className="inline-block h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ width: `${rating * 3}px` }}
                  />
                  {rating}/10 {descriptor}
                </span>
              ))}
            </div>

            <p className="mt-2.5 text-sm italic text-zinc-500 dark:text-zinc-400">
              {wine.story}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

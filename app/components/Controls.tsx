"use client";

import { getNextSide, getPrevSide } from "../lib/rotation";

interface ControlsProps {
  currentSide: number;
  setCurrentSide: (updater: (prev: number) => number) => void;
  isAnimating?: boolean;
}

export default function Controls({
  currentSide,
  setCurrentSide,
  isAnimating = false,
}: ControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        className="rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-zinc-800"
        onClick={() => setCurrentSide((prev) => getPrevSide(prev))}
        disabled={isAnimating}
        aria-label={`Rotate to side ${getPrevSide(currentSide)}`}
      >
        Previous
      </button>

      <button
        className="rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-zinc-800"
        onClick={() => setCurrentSide((prev) => getNextSide(prev))}
        disabled={isAnimating}
        aria-label={`Rotate to side ${getNextSide(currentSide)}`}
      >
        Next
      </button>
    </div>
  );
}

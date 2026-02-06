"use client";

import type { MarkerData } from "./CityScene";

interface MarkerCardProps {
  marker: MarkerData | null;
}

interface StatProps {
  label: string;
  value: number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-zinc-200">{value}</span>
    </div>
  );
}

export default function MarkerCard({ marker }: MarkerCardProps) {
  if (!marker) return null;

  return (
    <div className="w-72 rounded-xl bg-gradient-to-b from-amber-600 to-amber-950 p-[1px] shadow-lg shadow-black/40">
      <div className="rounded-xl bg-zinc-950 px-5 py-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-semibold leading-tight text-amber-400">
            {marker.title}
          </h3>
          <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
            Lv. {marker.level}
          </span>
        </div>

        {/* Element */}
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {marker.element}
        </p>

        {/* Stats */}
        <div className="flex gap-6">
          <Stat label="ATK" value={marker.attack} />
          <Stat label="DEF" value={marker.defense} />
        </div>
      </div>
    </div>
  );
}

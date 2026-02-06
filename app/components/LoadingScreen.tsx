"use client";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
        <p className="text-sm font-medium tracking-wider text-zinc-400">
          Loading City...
        </p>
      </div>
    </div>
  );
}

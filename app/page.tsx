"use client";

import { useState, useCallback, useEffect } from "react";
import { useProgress } from "@react-three/drei";
import CityScene, { type MarkerData } from "./components/CityScene";
import Compass from "./components/Compass";
import Controls from "./components/Controls";
import MarkerCard from "./components/MarkerCard";
import LoadingScreen from "./components/LoadingScreen";

export default function Home() {
  const [currentSide, setCurrentSide] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { progress } = useProgress();

  useEffect(() => {
    if (progress >= 100) setLoaded(true);
  }, [progress]);

  const handleMarkerSelect = useCallback((marker: MarkerData) => {
    setSelectedMarker((prev) => (prev?.id === marker.id ? null : marker));
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-zinc-950 md:relative">
      {/* ── Mobile compass: above map ─────────────────────────────────── */}
      {loaded && (
        <div className="flex shrink-0 justify-center py-2 md:hidden">
          <Compass currentSide={currentSide} setCurrentSide={setCurrentSide} />
        </div>
      )}

      {/* ── Map canvas ────────────────────────────────────────────────── */}
      <div className="relative h-[300px] shrink-0 md:h-auto md:min-h-[600px] md:flex-1">
        <CityScene
          currentSide={currentSide}
          onMarkerSelect={handleMarkerSelect}
          onDeselect={handleDeselect}
        />

        {/* Desktop compass: absolute within canvas area */}
        {loaded && (
          <div className="absolute top-6 right-6 hidden md:block">
            <Compass currentSide={currentSide} setCurrentSide={setCurrentSide} />
          </div>
        )}
      </div>

      {/* ── Loading overlay ───────────────────────────────────────────── */}
      {!loaded && <LoadingScreen />}

      {/* ── HUD (only visible after loading) ──────────────────────────── */}
      {loaded && (
        <>
          {/* ── Mobile: controls & card below canvas in normal flow ──── */}
          <div className="flex shrink-0 flex-col items-center gap-3 py-3 md:hidden">
            <Controls currentSide={currentSide} setCurrentSide={setCurrentSide} />
            <MarkerCard marker={selectedMarker} />
          </div>

          {/* ── Desktop: absolute overlays over canvas ───────────────── */}
          <div className={`hidden md:block absolute left-1/2 -translate-x-1/2 ${selectedMarker ? "bottom-40" : "bottom-6"} transition-[bottom] duration-300`}>
            <Controls currentSide={currentSide} setCurrentSide={setCurrentSide} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 hidden justify-center md:flex">
            <div className="pointer-events-auto">
              <MarkerCard marker={selectedMarker} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

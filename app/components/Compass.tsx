"use client";

interface CompassProps {
  currentSide: number;
  setCurrentSide: (side: number) => void;
}

const SIDES = 6;
const RADIUS = 40;
const CENTER = 50;

const SIDE_LABELS = ["N", "NE", "SE", "S", "SW", "NW"];

/** Build an SVG coordinate for a hexagon vertex. */
function hexPoint(index: number): { x: number; y: number } {
  const angleDeg = 60 * index - 30;
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: CENTER + RADIUS * Math.cos(angleRad),
    y: CENTER + RADIUS * Math.sin(angleRad),
  };
}

/** Build the SVG points string for a triangular segment from center to two adjacent vertices. */
function segmentPoints(index: number): string {
  const p1 = hexPoint(index);
  const p2 = hexPoint((index + 1) % SIDES);
  return `${CENTER},${CENTER} ${p1.x},${p1.y} ${p2.x},${p2.y}`;
}

/** Midpoint of a segment, used for label placement. */
function segmentMidpoint(index: number): { x: number; y: number } {
  const p1 = hexPoint(index);
  const p2 = hexPoint((index + 1) % SIDES);
  return {
    x: (CENTER + p1.x + p2.x) / 3,
    y: (CENTER + p1.y + p2.y) / 3,
  };
}

export default function Compass({ currentSide, setCurrentSide }: CompassProps) {
  return (
    <div
      className="flex h-20 w-20 items-center justify-center sm:h-[120px] sm:w-[120px]"
      role="navigation"
      aria-label="Hexagonal compass"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-lg">
        {/* Clickable hexagon segments */}
        {Array.from({ length: SIDES }).map((_, i) => {
          const isActive = i === currentSide;
          const mid = segmentMidpoint(i);

          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Side ${SIDE_LABELS[i]}`}
              aria-pressed={isActive}
              onClick={() => setCurrentSide(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCurrentSide(i);
                }
              }}
              className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <polygon
                points={segmentPoints(i)}
                className={
                  isActive
                    ? "fill-amber-500 stroke-amber-300"
                    : "fill-zinc-800 stroke-zinc-600 hover:fill-zinc-700"
                }
                strokeWidth={0.5}
              />
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={`pointer-events-none select-none text-[6px] font-bold ${
                  isActive ? "fill-zinc-950" : "fill-zinc-400"
                }`}
              >
                {SIDE_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* Outer hexagon border */}
        <polygon
          points={Array.from({ length: SIDES }, (_, i) => {
            const p = hexPoint(i);
            return `${p.x},${p.y}`;
          }).join(" ")}
          className="pointer-events-none fill-none stroke-zinc-500"
          strokeWidth={1}
        />

        {/* Center dot */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={3}
          className="pointer-events-none fill-amber-400"
        />
      </svg>
    </div>
  );
}

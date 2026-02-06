"use client";

import { memo, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Billboard, Text, Environment, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { getRotationAngle, getNextSide, getPrevSide } from "../lib/rotation";

// ── Types ───────────────────────────────────────────────────────────────────

export interface MarkerData {
  id: string;
  title: string;
  level: number;
  element: string;
  attack: number;
  defense: number;
  position: readonly [number, number, number];
}

// ── Config ──────────────────────────────────────────────────────────────────

// Easing: higher = snappier start, lower = slower settle
const SMOOTHING = 5;
// Stop jittering once delta is negligible
const EPSILON = 0.0005;
// Camera framing
const CAMERA_FOV = 75;
const CAMERA_ELEVATION_ANGLE = 2.85; // radians (~17°) — the viewing angle above horizon
const FRAMING_PADDING = 0.7; // extra breathing room around the bounding sphere
const MIN_CAMERA_DISTANCE = 5; // never clip into geometry

// Zoom limits relative to framed distance
const ZOOM_IN_FACTOR = 0.33; // can zoom in to 1/3 of framed distance
// Mobile: push camera further back so the full city fits on small screens
const MOBILE_BREAKPOINT = 1000;
const MOBILE_DISTANCE_FACTOR = 1.35;
const CUBEMAP_PATH = "/models/cubemaps1/";
const CUBEMAP_FILES = [
  "Sky_Space_Nebula_BlueRed_Cam_2_Left+X.png",
  "Sky_Space_Nebula_BlueRed_Cam_3_Right-X.png",
  "Sky_Space_Nebula_BlueRed_Cam_4_Up+Y.png",
  "Sky_Space_Nebula_BlueRed_Cam_5_Down-Y.png",
  "Sky_Space_Nebula_BlueRed_Cam_0_Front+Z.png",
  "Sky_Space_Nebula_BlueRed_Cam_1_Back-Z.png",
] as const;

const SIDE_LABELS = ["N", "NE", "SE", "S", "SW", "NW"] as const;
const SIDE_ELEMENTS = ["Light", "Wind", "Fire", "Dark", "Water", "Earth"] as const;
const MARKER_RING_RADIUS = 50; // tweak if markers need to move in/out to match pillar centers
const MARKER_BASE_Y = 0.55; // approximate top surface of the side pillar

const MARKERS: MarkerData[] = SIDE_LABELS.map((label, sideIndex) => {
  // +Z as north, clockwise every 60 degrees.
  const angle = (Math.PI / 2) - sideIndex * ((2 * Math.PI) / 6);
  const x = MARKER_RING_RADIUS * Math.cos(angle);
  const z = MARKER_RING_RADIUS * Math.sin(angle);

  return {
    id: `side-${label.toLowerCase()}`,
    title: `${label} Pillar`,
    level: 1 + sideIndex,
    element: SIDE_ELEMENTS[sideIndex],
    attack: 50 + sideIndex * 3,
    defense: 48 + sideIndex * 3,
    position: [x, MARKER_BASE_Y, z] as const,
  };
});

const MODEL_ENTRIES = [
  { path: "/models/map.glb", position: [0, 0, 0] as const, scale: 1 },
  { path: "/models/centerCrystal.glb", position: [0, 0.5, 0] as const, scale: 1 },
  { path: "/models/wallGate.glb", position: [3, 0, 0] as const, scale: 1 },
  { path: "/models/barrack.glb", position: [-3, 0, 2] as const, scale: 1 },
  { path: "/models/fireTower.glb", position: [2, 0, -3] as const, scale: 1 },
  { path: "/models/waterTower.glb", position: [-2, 0, -3] as const, scale: 1 },
  { path: "/models/windTower.glb", position: [4, 0, 3] as const, scale: 1 },
  { path: "/models/lightTower.glb", position: [-4, 0, 3] as const, scale: 1 },
  { path: "/models/darkTower.glb", position: [5, 0, -2] as const, scale: 1 },
  { path: "/models/golem.glb", position: [-5, 0, -1] as const, scale: 1 },
  { path: "/models/ballista.glb", position: [3, 0, 5] as const, scale: 1 },
  { path: "/models/stoneThrower.glb", position: [-3, 0, 5] as const, scale: 1 },
] as const;

// ── Model component ────────────────────────────────────────────────────────

interface ModelProps {
  path: string;
  position: readonly [number, number, number];
  scale: number;
}

const Model = memo(function Model({ path, position, scale }: ModelProps) {
  const { scene } = useGLTF(path);
  return (
    <primitive
      object={scene.clone()}
      position={position}
      scale={scale}
    />
  );
});

// ── Marker component ────────────────────────────────────────────────────────

interface MarkerProps {
  marker: MarkerData;
  isSelected: boolean;
  onSelect: (marker: MarkerData) => void;
}

const MARKER_RADIUS = 5;
const MARKER_COLOR = "#f59e0b";
const MARKER_SELECTED_COLOR = "#fbbf24";
const MARKER_Y_OFFSET = 40; // small lift above pillar top

const Marker = memo(function Marker({ marker, isSelected, onSelect }: MarkerProps) {
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(marker);
    },
    [marker, onSelect],
  );

  const [x, y, z] = marker.position;

  return (
    <Billboard position={[x, y + MARKER_Y_OFFSET, z] as THREE.Vector3Tuple}>
      <group scale={isSelected ? 1.3 : 1}>
        {/* Badge circle background */}
        <mesh onClick={handleClick} renderOrder={1}>
          <circleGeometry args={[MARKER_RADIUS, 32]} />
          <meshStandardMaterial
            color={isSelected ? MARKER_SELECTED_COLOR : MARKER_COLOR}
            emissive={isSelected ? MARKER_SELECTED_COLOR : MARKER_COLOR}
            emissiveIntensity={isSelected ? 1.0 : 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer glow ring when selected */}
        {isSelected && (
          <mesh position={[0, 0, -0.5]} renderOrder={0}>
            <ringGeometry args={[MARKER_RADIUS + 0.03, MARKER_RADIUS + 0.15, 32]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fbbf24"
              emissiveIntensity={1.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Level number */}
        <Text
          position={[0, 0, 0.5]}
          fontSize={4}
          color="#1a1a2e"
          outlineWidth={0.03}
          outlineColor="#fef3c7"
          anchorX="center"
          anchorY="middle"
          renderOrder={2}
        >
          {String(marker.level)}
        </Text>
      </group>
    </Billboard>
  );
});

// ── CityGroup (rotation + models + markers) ────────────────────────────────

interface CityGroupProps {
  currentSide: number;
  selectedMarkerId: string | null;
  onMarkerSelect: (marker: MarkerData) => void;
  groupRef: React.RefObject<THREE.Group | null>;
}

const ANGLE_PER_SIDE = (2 * Math.PI) / 6;

function CityGroup({ currentSide, selectedMarkerId, onMarkerSelect, groupRef }: CityGroupProps) {
  const prevSideRef = useRef(currentSide);
  const accumulatedRef = useRef(getRotationAngle(currentSide));

  // Detect side changes and accumulate rotation continuously
  useEffect(() => {
    const prev = prevSideRef.current;
    if (prev === currentSide) return;

    // Determine direction: forward (+1 step) or backward (-1 step)
    if (getNextSide(prev) === currentSide) {
      accumulatedRef.current += ANGLE_PER_SIDE;
    } else if (getPrevSide(prev) === currentSide) {
      accumulatedRef.current -= ANGLE_PER_SIDE;
    } else {
      // Direct jump (e.g. compass click) — take shortest path
      let delta = getRotationAngle(currentSide) - getRotationAngle(prev);
      delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
      accumulatedRef.current += delta;
    }

    prevSideRef.current = currentSide;
  }, [currentSide]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;

    const target = accumulatedRef.current;
    const current = groupRef.current.rotation.y;
    const delta = target - current;

    // Snap when close enough to avoid micro-jitter
    if (Math.abs(delta) < EPSILON) {
      groupRef.current.rotation.y = target;
      return;
    }

    // Frame-rate independent damped interpolation for smooth ease-out
    const factor = 1 - Math.exp(-SMOOTHING * dt);
    groupRef.current.rotation.y = current + delta * factor;
  });

  return (
    <group ref={groupRef}>
      {/* 3D models */}
      {MODEL_ENTRIES.map((entry) => (
        <Model
          key={entry.path}
          path={entry.path}
          position={entry.position}
          scale={entry.scale}
        />
      ))}

      {/* Clickable markers */}
      {MARKERS.map((marker) => (
        <Marker
          key={marker.id}
          marker={marker}
          isSelected={marker.id === selectedMarkerId}
          onSelect={onMarkerSelect}
        />
      ))}
    </group>
  );
}

// ── Auto-framing camera ─────────────────────────────────────────────────────

interface AutoFrameCameraProps {
  groupRef: React.RefObject<THREE.Group | null>;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

function AutoFrameCamera({ groupRef, controlsRef }: AutoFrameCameraProps) {
  const { camera, size } = useThree();
  const hasFramed = useRef(false);

  useEffect(() => {
    if (hasFramed.current || !groupRef.current || groupRef.current.children.length === 0) return;

    // Wait a tick for models to populate the group
    const id = requestAnimationFrame(() => {
      if (!groupRef.current) return;

      const box = new THREE.Box3().setFromObject(groupRef.current);
      if (box.isEmpty()) return;

      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const center = sphere.center;
      const radius = sphere.radius * FRAMING_PADDING;

      // Distance needed so the sphere fits inside the vertical FOV
      const fovRad = THREE.MathUtils.degToRad(CAMERA_FOV);
      let distance = Math.max(radius / Math.tan(fovRad / 2), MIN_CAMERA_DISTANCE);

      // On small screens, push the camera further back so the city isn't clipped
      if (size.width < MOBILE_BREAKPOINT) {
        distance *= MOBILE_DISTANCE_FACTOR;
      }

      // Position camera at an elevated angle looking at center
      const camY = center.y + distance * Math.sin(CAMERA_ELEVATION_ANGLE);
      const camZ = center.z + distance * Math.cos(CAMERA_ELEVATION_ANGLE);

      camera.position.set(center.x, camY, camZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // Configure OrbitControls zoom limits
      if (controlsRef.current) {
        const controls = controlsRef.current;
        controls.target.copy(center);
        controls.minDistance = distance * ZOOM_IN_FACTOR;
        controls.maxDistance = distance;
        controls.update();
      }

      hasFramed.current = true;
    });

    return () => cancelAnimationFrame(id);
  }, [groupRef, controlsRef, camera, size.width]);

  return null;
}

// ── Loader gate ──────────────────────────────────────────────────────────────

interface LoaderGateProps {
  onReady: () => void;
  children: React.ReactNode;
}

function LoaderGate({ onReady, children }: LoaderGateProps) {
  const { progress } = useProgress();

  useEffect(() => {
    if (progress >= 100) {
      // Wait one frame so the GPU composites the first complete scene frame
      const id = requestAnimationFrame(() => onReady());
      return () => cancelAnimationFrame(id);
    }
  }, [progress, onReady]);

  if (progress < 100) return null;
  return <>{children}</>;
}

// ── Preload ─────────────────────────────────────────────────────────────────

MODEL_ENTRIES.forEach((entry) => useGLTF.preload(entry.path));

// ── CityScene ───────────────────────────────────────────────────────────────

interface CitySceneProps {
  currentSide: number;
  onMarkerSelect: (marker: MarkerData) => void;
  onDeselect: () => void;
}

export default function CityScene({ currentSide, onMarkerSelect, onDeselect }: CitySceneProps) {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const cityGroupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  const handleMarkerSelect = useCallback(
    (marker: MarkerData) => {
      setSelectedMarkerId((prev) => (prev === marker.id ? null : marker.id));
      onMarkerSelect(marker);
    },
    [onMarkerSelect],
  );

  const handlePointerMissed = useCallback(() => {
    setSelectedMarkerId(null);
    onDeselect();
  }, [onDeselect]);

  const handleReady = useCallback(() => setReady(true), []);

  return (
    <Canvas
      camera={{ position: [0, 8, 14], fov: CAMERA_FOV }}
      className="h-full w-full"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s ease-in" }}
      onPointerMissed={handlePointerMissed}
    >
      <Suspense fallback={null}>
        {/* Environment loads its textures inside Suspense */}
        <Environment
          files={[...CUBEMAP_FILES]}
          path={CUBEMAP_PATH}
          background
          environmentIntensity={0.5}
        />

        {/* Gate scene rendering until all assets (models + textures) are loaded */}
        <LoaderGate onReady={handleReady}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 15, 10]} intensity={1} />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>

          {/* City container — rotates around Y-axis */}
          <CityGroup
            currentSide={currentSide}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={handleMarkerSelect}
            groupRef={cityGroupRef}
          />

          {/* Zoom-only orbit controls */}
          <OrbitControls
            ref={controlsRef}
            enableRotate={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.1}
          />

          {/* Reposition camera to frame the loaded city */}
          <AutoFrameCamera groupRef={cityGroupRef} controlsRef={controlsRef} />
        </LoaderGate>
      </Suspense>
    </Canvas>
  );
}

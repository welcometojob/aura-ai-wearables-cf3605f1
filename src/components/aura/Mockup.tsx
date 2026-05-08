import { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Decal,
  useTexture,
  Environment,
  Center,
  Html,
} from "@react-three/drei";
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import * as THREE from "three";
import type { ColorSwatch, View } from "@/lib/aura-config";

const SHIRT_URL =
  "https://pub-0cbfa3c582404e5bb1e0615b530aa67d.r2.dev/models/shirt_baked.glb";

useGLTF.preload(SHIRT_URL);

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

function Shirt({
  color,
  artwork,
  view,
  zoom,
}: {
  color: ColorSwatch;
  artwork: string | null;
  view: View;
  zoom: number;
}) {
  const { nodes, materials } = useGLTF(SHIRT_URL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.MeshStandardMaterial>;
  };

  const meshNode = useMemo(() => {
    const meshKey = Object.keys(nodes).find(
      (k) => (nodes[k] as THREE.Mesh)?.isMesh,
    );
    return meshKey ? nodes[meshKey] : null;
  }, [nodes]);

  const matKey = Object.keys(materials)[0];
  const material = matKey ? materials[matKey] : null;

  useEffect(() => {
    if (!material) return;
    material.color = new THREE.Color(color.hex);
    material.roughness = 0.85;
    material.metalness = 0.05;
    material.needsUpdate = true;
  }, [material, color.hex]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = view === "back" ? Math.PI : 0;
    const cur = groupRef.current.rotation.y;
    // smooth toward target without overriding user drag too aggressively
    groupRef.current.rotation.y = cur + (targetY - cur) * Math.min(1, delta * 4);
    const curScale = groupRef.current.scale.x;
    const next = curScale + (zoom - curScale) * Math.min(1, delta * 6);
    groupRef.current.scale.setScalar(next);
  });

  if (!meshNode) return null;

  return (
    <group ref={groupRef} dispose={null} scale={zoom}>
      <Center>
        <mesh
          castShadow
          geometry={meshNode.geometry}
          material={material ?? undefined}
          material-roughness={0.85}
          scale={1}
        >
          {artwork && (
            <ArtworkDecal artwork={artwork} side={view} />
          )}
        </mesh>
      </Center>
    </group>
  );
}

function ArtworkDecal({ artwork, side }: { artwork: string; side: View }) {
  const texture = useTexture(artwork);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Front decal sits on chest; back decal sits on upper back.
  const position: [number, number, number] =
    side === "front" ? [0, 0.04, 0.15] : [0, 0.04, -0.15];
  const rotation: [number, number, number] =
    side === "front" ? [0, 0, 0] : [0, Math.PI, 0];
  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={0.18}
      map={texture}
    />
  );
}

function Loading() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading 3D…
      </div>
    </Html>
  );
}

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const controlsRef = useRef<any>(null);

  const reset = () => {
    setZoom(1);
    controlsRef.current?.reset?.();
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex items-center justify-center gap-3 px-2 pb-4 relative">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all ${
                view === v
                  ? "bg-primary text-primary-foreground neon-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} View
            </button>
          ))}
        </div>
        <div className="absolute right-2 flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={reset}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <Canvas
          shadows
          camera={{ position: [0, 0, 2.4 / zoom], fov: 28 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[3, 4, 5]}
            intensity={1.1}
            castShadow
          />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} />
          <Environment preset="studio" />

          <Suspense fallback={<Loading />}>
            <Shirt color={color} artwork={artwork} view={view} zoom={zoom} />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.8}
            rotateSpeed={0.8}
          />
        </Canvas>

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Drag to rotate
        </div>
      </div>
    </div>
  );
}

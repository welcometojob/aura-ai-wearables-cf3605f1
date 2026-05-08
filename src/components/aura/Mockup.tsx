import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Center, Decal, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { ColorSwatch, View } from "@/lib/aura-config";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

useGLTF.preload("/models/shirt.glb");

function Shirt({ color, artwork, view }: { color: string; artwork: string | null; view: View }) {
  const { nodes, materials } = useGLTF("/models/shirt.glb") as any;

  const texture = artwork
    ? useLoader(THREE.TextureLoader, artwork)
    : null;
  if (texture) {
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  // Find first mesh node
  const meshNode = Object.values(nodes).find(
    (n: any) => n?.isMesh
  ) as THREE.Mesh | undefined;
  const material = (materials && Object.values(materials)[0]) as THREE.MeshStandardMaterial | undefined;

  if (!meshNode || !material) return null;

  // Apply color
  material.color = new THREE.Color(color);
  material.roughness = 0.85;
  material.metalness = 0.05;

  return (
    <group rotation={[0, view === "back" ? Math.PI : 0, 0]} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={meshNode.geometry}
        material={material}
        material-roughness={0.85}
      >
        {texture && (
          <Decal
            position={[0, 0.04, view === "back" ? -0.15 : 0.15]}
            rotation={[0, view === "back" ? Math.PI : 0, 0]}
            scale={0.18}
            map={texture}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        )}
      </mesh>
    </group>
  );
}

function CameraRig({ zoom }: { zoom: number }) {
  useFrame((state) => {
    const targetZ = 1.6 / zoom;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.1;
    state.camera.updateProjectionMatrix();
  });
  return null;
}

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);

  const reset = () => {
    setZoom(1);
    controlsRef.current?.reset();
  };
  const clamp = (v: number) => Math.max(0.6, Math.min(2.2, v));

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative flex items-center justify-center gap-3 px-2 pb-4">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
                view === v ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v} View
            </button>
          ))}
        </div>
        <div className="absolute right-2 flex items-center gap-1">
          <button onClick={() => setZoom((z) => clamp(z + 0.15))} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((z) => clamp(z - 0.15))} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Reset view">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-background to-muted">
        {mounted && (
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, 0, 1.6], fov: 32 }}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
          >
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, 2, 3]} intensity={0.5} />
            <directionalLight position={[0, -3, -4]} intensity={0.35} />
            <Environment preset="city" />
            <Suspense fallback={null}>
              <Center>
                <Shirt color={color.hex} artwork={artwork} view={view} />
              </Center>
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom
              minDistance={0.8}
              maxDistance={3.5}
              autoRotate={false}
            />
            <CameraRig zoom={zoom} />
          </Canvas>
        )}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Drag to rotate · Scroll to zoom
        </div>
      </div>
    </div>
  );
}

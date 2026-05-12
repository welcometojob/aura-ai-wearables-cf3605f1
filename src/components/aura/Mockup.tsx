import { Suspense, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Center, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { ColorSwatch, View } from "@/lib/aura-config";
import { getArtworkDataUri } from "@/lib/artwork-texture.functions";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

function ArtworkPlane({ url, view }: { url: string; view: View }) {
  const texture = useLoader(THREE.TextureLoader, url);
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  const isBack = view === "back";

  return (
    <mesh position={[0, -0.08, isBack ? -0.075 : 0.075]} rotation={[0, isBack ? Math.PI : 0, 0]} renderOrder={10}>
      <planeGeometry args={[0.56, 0.64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-10}
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Shirt({ color, artwork, view }: { color: string; artwork: string | null; view: View }) {
  const shirtGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.34, 0.78);
    shape.lineTo(-0.72, 0.53);
    shape.lineTo(-0.88, 0.22);
    shape.lineTo(-0.63, 0.02);
    shape.lineTo(-0.45, 0.22);
    shape.lineTo(-0.39, -0.86);
    shape.lineTo(0.39, -0.86);
    shape.lineTo(0.45, 0.22);
    shape.lineTo(0.63, 0.02);
    shape.lineTo(0.88, 0.22);
    shape.lineTo(0.72, 0.53);
    shape.lineTo(0.34, 0.78);
    shape.bezierCurveTo(0.22, 0.62, -0.22, 0.62, -0.34, 0.78);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 8 });
  }, []);

  const shirtMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.88, metalness: 0, side: THREE.DoubleSide }),
    [color],
  );

  return (
    <group rotation={[0, view === "back" ? Math.PI : 0, 0]} scale={1.32}>
      <mesh castShadow receiveShadow geometry={shirtGeometry} material={shirtMaterial} position={[0, 0, -0.07]} />
      <mesh position={[0, 0.7, 0.08]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.21, 0.026, 16, 64, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {artwork && (
        <Suspense fallback={null}>
          <ArtworkPlane url={artwork} view={view} />
        </Suspense>
      )}
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
  const [textureArtwork, setTextureArtwork] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    if (!artwork) {
      setTextureArtwork(null);
      return;
    }
    if (artwork.startsWith("data:")) {
      setTextureArtwork(artwork);
      return;
    }
    setTextureArtwork(null);
    getArtworkDataUri({ data: { url: artwork } })
      .then(({ dataUri }) => {
        if (!cancelled) setTextureArtwork(dataUri);
      })
      .catch(() => {
        if (!cancelled) setTextureArtwork(artwork);
      });
    return () => {
      cancelled = true;
    };
  }, [artwork]);

  const reset = () => {
    setZoom(1);
    controlsRef.current?.reset();
  };
  const clamp = (v: number) => Math.max(0.6, Math.min(2.2, v));
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((z) => clamp(z + (event.deltaY < 0 ? 0.12 : -0.12)));
  };

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

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-background to-muted" onWheel={handleWheel}>
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
                <Shirt color={color.hex} artwork={textureArtwork} view={view} />
              </Center>
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={false}
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

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import * as THREE from "three";
import type { ColorSwatch, View } from "@/lib/aura-config";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
};

function ShirtMockup({ color, artwork, view, zoom }: { color: ColorSwatch; artwork: string | null; view: View; zoom: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const shirtColor = useMemo(() => new THREE.Color(color.hex), [color.hex]);
  const ribColor = useMemo(() => new THREE.Color(color.hex).lerp(new THREE.Color("#ffffff"), color.id === "black" ? 0.28 : 0.08), [color.hex, color.id]);
  const shirtMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: shirtColor,
        roughness: 0.68,
        metalness: 0,
      }),
    [shirtColor],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = view === "back" ? Math.PI : 0;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * Math.min(1, delta * 5);
    groupRef.current.scale.lerp(new THREE.Vector3(zoom, zoom, zoom), Math.min(1, delta * 7));
  });

  return (
    <group ref={groupRef} scale={zoom} position={[0, -0.02, 0]}>
      <mesh material={shirtMaterial} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 0.7, 10, 40]} />
      </mesh>
      <mesh material={shirtMaterial} position={[-0.43, 0.25, -0.01]} rotation={[0, 0, -0.83]} castShadow>
        <capsuleGeometry args={[0.13, 0.46, 10, 28]} />
      </mesh>
      <mesh material={shirtMaterial} position={[0.43, 0.25, -0.01]} rotation={[0, 0, 0.83]} castShadow>
        <capsuleGeometry args={[0.13, 0.46, 10, 28]} />
      </mesh>
      <mesh position={[0, 0.57, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.026, 16, 40]} />
        <meshStandardMaterial color={ribColor} roughness={0.8} />
      </mesh>
      {artwork && <ArtworkPlane artwork={artwork} side={view} />}
    </group>
  );
}

function ArtworkPlane({ artwork, side }: { artwork: string; side: View }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      artwork,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [artwork]);

  if (!texture) return null;

  return (
    <mesh position={side === "front" ? [0, 0.05, 0.408] : [0, 0.05, -0.408]} rotation={side === "front" ? [0, 0, 0] : [0, Math.PI, 0]} renderOrder={10}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} side={THREE.FrontSide} />
    </mesh>
  );
}

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reset = () => {
    setZoom(1);
    controlsRef.current?.reset?.();
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
          <button onClick={() => setZoom((z) => Math.min(1.45, z + 0.1))} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.75, z - 0.1))} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Reset view">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-background to-muted">
        {mounted ? (
          <Canvas shadows camera={{ position: [0, 0, 3.25], fov: 28 }} gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }} dpr={[1, 1.5]}>
            <ambientLight intensity={1.15} />
            <directionalLight position={[2.5, 4, 4]} intensity={1.8} castShadow />
            <directionalLight position={[-3, 2, 2]} intensity={0.9} />
            <directionalLight position={[0, 1, 4]} intensity={0.65} />
            <ShirtMockup color={color} artwork={artwork} view={view} zoom={zoom} />
            <OrbitControls ref={controlsRef} enablePan={false} enableZoom minDistance={2.1} maxDistance={4.2} minPolarAngle={Math.PI / 2.7} maxPolarAngle={Math.PI / 1.75} rotateSpeed={0.8} />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading preview...</div>
        )}

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Drag or scroll to view
        </div>
      </div>
    </div>
  );
}
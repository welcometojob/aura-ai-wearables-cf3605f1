import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Decal,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
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

useGLTF.preload("/models/shirt.glb");

function ArtworkDecal({
  url,
  side,
}: {
  url: string;
  side: "front" | "back";
}) {
  const texture = useLoader(TextureLoader, url);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  // Position on chest (front) / upper back (back)
  const z = side === "front" ? 0.15 : -0.15;
  const rotY = side === "front" ? 0 : Math.PI;

  return (
    <Decal
      position={[0, 0.04, z]}
      rotation={[0, rotY, 0]}
      scale={[0.18, 0.22, 0.18]}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        roughness={0.85}
        metalness={0}
        depthTest
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-10}
      />
    </Decal>
  );
}

function Shirt({
  color,
  artworkUri,
  view,
}: {
  color: string;
  artworkUri: { front: string | null; back: string | null };
  view: View;
}) {
  const { nodes } = useGLTF("/models/shirt.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const meshNode = nodes["T_Shirt_male"];
  const groupRef = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const targetRotY = view === "back" ? Math.PI : 0;

  // Build a clean fabric material — strip any baked textures (AO/diffuse/normal)
  // from the GLB that were producing the dark stain-like patches on the shirt.
  const fabricMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.78,
      metalness: 0,
      map: null,
      normalMap: null,
      aoMap: null,
      roughnessMap: null,
      metalnessMap: null,
      emissiveMap: null,
      bumpMap: null,
      displacementMap: null,
      side: THREE.FrontSide,
    });
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    // Smooth color on our clean fabric material
    fabricMaterial.color.lerp(targetColor, Math.min(1, dt * 6));
    // Smooth rotation between front/back
    const cur = groupRef.current.rotation.y;
    groupRef.current.rotation.y = cur + (targetRotY - cur) * Math.min(1, dt * 5);
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Center>
        <mesh
          castShadow
          receiveShadow
          geometry={meshNode.geometry}
          material={fabricMaterial}
        >
          {artworkUri.front && (
            <Suspense fallback={null}>
              <ArtworkDecal url={artworkUri.front} side="front" />
            </Suspense>
          )}
          {artworkUri.back && (
            <Suspense fallback={null}>
              <ArtworkDecal url={artworkUri.back} side="back" />
            </Suspense>
          )}
        </mesh>
      </Center>
    </group>
  );
}

function CameraRig({ zoom }: { zoom: number }) {
  useFrame(({ camera }, dt) => {
    const targetZ = 2.4 / zoom;
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 4);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const clamp = (v: number) => Math.max(0.6, Math.min(2.2, v));

export function Mockup({ view, setView, color, artwork }: Props) {
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [frontArt, setFrontArt] = useState<string | null>(null);
  const [backArt, setBackArt] = useState<string | null>(null);
  const [loadingArt, setLoadingArt] = useState(false);

  useEffect(() => setMounted(true), []);

  // Resolve artwork URL → CORS-safe data URI, then assign to active side.
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!artwork) return;
      try {
        let uri = artwork;
        if (/^https?:\/\//i.test(artwork)) {
          setLoadingArt(true);
          const res = await getArtworkDataUri({ data: { url: artwork } });
          uri = res.dataUri;
        }
        if (cancelled) return;
        if (view === "back") setBackArt(uri);
        else setFrontArt(uri);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingArt(false);
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [artwork, view]);

  const reset = () => setZoom(1);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative flex items-center justify-center gap-3 px-2 pb-4">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
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
            onClick={() => setZoom((z) => clamp(z + 0.12))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => clamp(z - 0.12))}
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

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/30 via-background to-muted/30">
        {/* Soft studio backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(1_0_0/0.08),_transparent_60%)]" />

        {loadingArt && (
          <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
            <Loader2 className="h-3 w-3 animate-spin" /> Applying art
          </div>
        )}

        {mounted && (
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            camera={{ position: [0, 0, 2.4], fov: 28 }}
          >
            <ambientLight intensity={0.55} />
            <directionalLight
              position={[4, 6, 6]}
              intensity={0.9}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0005}
              shadow-normalBias={0.05}
            />
            <directionalLight position={[-5, 3, -4]} intensity={0.35} />
            <directionalLight position={[0, -3, 4]} intensity={0.25} />
            <Environment preset="studio" />

            <Suspense fallback={null}>
              <Shirt
                color={color.hex}
                artworkUri={{ front: frontArt, back: backArt }}
                view={view}
              />
            </Suspense>

            <ContactShadows
              position={[0, -0.55, 0]}
              opacity={0.35}
              scale={4}
              blur={3}
              far={1.2}
            />

            <CameraRig zoom={zoom} />

            <OrbitControls
              enablePan={false}
              enableZoom
              minDistance={1.2}
              maxDistance={4}
              minPolarAngle={Math.PI / 2.6}
              maxPolarAngle={Math.PI / 1.8}
              onChange={() => {}}
            />
          </Canvas>
        )}

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Drag to rotate · Scroll to zoom
        </div>
      </div>
    </div>
  );
}

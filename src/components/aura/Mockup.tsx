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
import { ZoomIn, ZoomOut, RotateCcw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ColorSwatch, ProductStyle, View, Fit } from "@/lib/aura-config";
import { getArtworkDataUri } from "@/lib/artwork-texture.functions";
import { Slider } from "@/components/ui/slider";

type Props = {
  view: View;
  setView: (v: View) => void;
  color: ColorSwatch;
  artwork: string | null;
  styleName: string;
  fabric: string;
  fit?: Fit;
  product?: ProductStyle;
  productStyles?: ProductStyle[];
  setFit?: (f: Fit) => void;
  setProduct?: (p: ProductStyle) => void;
};

useGLTF.preload("/models/shirt.glb");

// SVG data URI for a soft V-neck shadow overlay used when fit === "Women".
// A downward-pointing triangle with a vertical gradient gives the impression
// of a V-neck cut without altering the underlying mesh geometry.
const V_NECK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='black' stop-opacity='0.55'/>
          <stop offset='70%' stop-color='black' stop-opacity='0.18'/>
          <stop offset='100%' stop-color='black' stop-opacity='0'/>
        </linearGradient>
      </defs>
      <polygon points='10,0 190,0 100,170' fill='url(#g)'/>
    </svg>`,
  );

function VNeckDecal() {
  const texture = useLoader(TextureLoader, V_NECK_SVG);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <Decal position={[0, 0.42, 0.15]} rotation={[0, 0, 0]} scale={[0.18, 0.18, 0.18]}>
      <meshBasicMaterial map={texture} transparent toneMapped={false} depthTest depthWrite={false} polygonOffset polygonOffsetFactor={-8} />
    </Decal>
  );
}

// Procedural hood — a hemispherical fabric blob sitting at the top
// of the shirt mesh so hoodie variants read as visually distinct from tees.
function HoodMesh({ color }: { color: string }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const target = useMemo(() => new THREE.Color(color), [color]);
  useFrame((_, dt) => {
    if (matRef.current) {
      matRef.current.color.lerp(target, Math.min(1, dt * 6));
    }
  });
  return (
    <group position={[0, 0.52, -0.05]} rotation={[0.25, 0, 0]}>
      <mesh castShadow receiveShadow scale={[0.32, 0.22, 0.28]}>
        <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
        <meshStandardMaterial ref={matRef} color={color} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function getVariantScale(fit: Fit, productId: string): [number, number, number] {
  const hoodie = productId === "hoodie";
  if (fit === "Kids") return hoodie ? [0.82, 0.86, 0.84] : [0.78, 0.82, 0.8];
  if (fit === "Women") return hoodie ? [0.95, 1.08, 0.96] : [0.92, 1.02, 0.95];
  // Men
  return hoodie ? [1.08, 1.1, 1.05] : [1, 1, 1];
}

function ArtworkDecal({
  url,
  side,
  scale,
}: {
  url: string;
  side: "front" | "back";
  scale: number;
}) {
  const texture = useLoader(TextureLoader, url);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }, [texture]);

  // Position on chest (front) / upper back (back)
  const z = side === "front" ? 0.15 : -0.15;
  const rotY = side === "front" ? 0 : Math.PI;
  const s = scale;

  return (
    <Decal
      position={[0, 0.04, z]}
      rotation={[0, rotY, 0]}
      scale={[0.22 * s, 0.27 * s, 0.22 * s]}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        toneMapped={false}
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
  artworkScale,
  view,
  fit,
  productId,
}: {
  color: string;
  artworkUri: { front: string | null; back: string | null };
  artworkScale: { front: number; back: number };
  view: View;
  fit: Fit;
  productId: string;
}) {
  const { nodes } = useGLTF("/models/shirt.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const meshNode = nodes["T_Shirt_male"];
  const groupRef = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const targetRotY = view === "back" ? Math.PI : 0;
  const variantScale = useMemo(() => getVariantScale(fit, productId), [fit, productId]);
  const isHoodie = productId === "hoodie";

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
        <group scale={variantScale}>
          <mesh
            castShadow
            receiveShadow
            geometry={meshNode.geometry}
            material={fabricMaterial}
          >
            {fit === "Women" && !isHoodie && (
              <Suspense fallback={null}>
                <VNeckDecal />
              </Suspense>
            )}
            {artworkUri.front && (
              <Suspense fallback={null}>
                <ArtworkDecal url={artworkUri.front} side="front" scale={artworkScale.front} />
              </Suspense>
            )}
            {artworkUri.back && (
              <Suspense fallback={null}>
                <ArtworkDecal url={artworkUri.back} side="back" scale={artworkScale.back} />
              </Suspense>
            )}
          </mesh>
          {isHoodie && <HoodMesh color={color} />}
        </group>
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

export function Mockup({ view, setView, color, artwork, fit = "Men", product, productStyles, setFit, setProduct }: Props) {
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [frontArt, setFrontArt] = useState<string | null>(null);
  const [backArt, setBackArt] = useState<string | null>(null);
  const [frontScale, setFrontScale] = useState(1);
  const [backScale, setBackScale] = useState(1);
  const [loadingArt, setLoadingArt] = useState(false);

  useEffect(() => setMounted(true), []);

  // Build carousel variant list (Men Tee, Women Tee, Men Hoodie, Women Hoodie, Kids Tee)
  const tee = useMemo(
    () => productStyles?.find((p) => p.id === "standard") ?? null,
    [productStyles],
  );
  const hoodie = useMemo(
    () => productStyles?.find((p) => p.id === "hoodie") ?? null,
    [productStyles],
  );
  const variants = useMemo(() => {
    const list: Array<{ fit: Fit; product: ProductStyle; label: string }> = [];
    if (tee) list.push({ fit: "Men", product: tee, label: "Men's Standard" });
    if (tee) list.push({ fit: "Women", product: tee, label: "Women's Standard" });
    if (hoodie) list.push({ fit: "Men", product: hoodie, label: "Men's Hoodie" });
    if (hoodie) list.push({ fit: "Women", product: hoodie, label: "Women's Hoodie" });
    if (tee) list.push({ fit: "Kids", product: tee, label: "Kids' Standard" });
    return list;
  }, [tee, hoodie]);

  const currentIdx = useMemo(() => {
    if (!product) return 0;
    const i = variants.findIndex((v) => v.fit === fit && v.product.id === product.id);
    return i < 0 ? 0 : i;
  }, [variants, fit, product]);

  const goVariant = (delta: number) => {
    if (variants.length === 0 || !setFit || !setProduct) return;
    const next = (currentIdx + delta + variants.length) % variants.length;
    const v = variants[next];
    setFit(v.fit);
    setProduct(v.product);
  };

  const canCarousel = variants.length > 1 && Boolean(setFit && setProduct);
  const currentLabel = variants[currentIdx]?.label;

  // Resolve artwork URL → CORS-safe data URI, then assign to active side.
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!artwork) {
        // Clear the current side's artwork so deleting from the panel
        // also removes it from the t-shirt mockup.
        if (view === "back") setBackArt(null);
        else setFrontArt(null);
        return;
      }
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
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-2 pb-4 sm:justify-center">
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
        <div className="flex items-center gap-1 sm:absolute sm:right-2">
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

        {canCarousel && (
          <>
            <button
              type="button"
              onClick={() => goVariant(-1)}
              aria-label="Previous style"
              className="absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/80 text-foreground shadow-md backdrop-blur transition hover:border-primary hover:text-primary sm:left-4 sm:h-11 sm:w-11"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goVariant(1)}
              aria-label="Next style"
              className="absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/80 text-foreground shadow-md backdrop-blur transition hover:border-primary hover:text-primary sm:right-4 sm:h-11 sm:w-11"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {currentLabel && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-border bg-card/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
                {currentLabel}
              </div>
            )}
            <div className="pointer-events-none absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
              {variants.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIdx ? "w-5 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </>
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
                artworkScale={{ front: frontScale, back: backScale }}
                view={view}
                fit={fit}
                productId={product?.id ?? "standard"}
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
              target={[0, 0, 0]}
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

      {((view === "front" && frontArt) || (view === "back" && backArt)) && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Artwork size
          </span>
          <Slider
            value={[view === "back" ? backScale : frontScale]}
            min={0.4}
            max={1.8}
            step={0.01}
            onValueChange={(v) => {
              const next = v[0] ?? 1;
              if (view === "back") setBackScale(next);
              else setFrontScale(next);
            }}
            className="flex-1"
          />
          <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round((view === "back" ? backScale : frontScale) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

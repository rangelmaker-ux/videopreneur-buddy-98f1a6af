import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import logoUrl from "@/assets/logo.png";

function LogoMesh({ spin = true }: { spin?: boolean }) {
  const texture = useLoader(THREE.TextureLoader, logoUrl);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // crisper alpha edges
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((state, delta) => {
    if (meshRef.current && spin) {
      meshRef.current.rotation.y += delta * 0.6;
      // gentle bob
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
    }
    if (glowRef.current) {
      const s = 1.15 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      glowRef.current.scale.set(s, s, s);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group>
      {/* glow halo behind */}
      <mesh ref={glowRef} position={[0, 0, -0.15]}>
        <circleGeometry args={[1.25, 64]} />
        <meshBasicMaterial
          color={"#3b82f6"}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* logo plane */}
      <mesh ref={meshRef}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          metalness={0.4}
          roughness={0.25}
          emissiveMap={texture}
          emissive={new THREE.Color("#3b82f6")}
          emissiveIntensity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface Logo3DProps {
  className?: string;
  size?: number;
  spin?: boolean;
}

export function Logo3D({ className, size = 160, spin = true }: Logo3DProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 4]} intensity={1.4} color={"#a5c7ff"} />
        <directionalLight position={[-3, -2, 2]} intensity={0.6} color={"#7c3aed"} />
        <Suspense fallback={null}>
          <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.6}>
            <LogoMesh spin={spin} />
          </Float>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

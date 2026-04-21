import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Float,
  RoundedBox,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import * as THREE from "three";

/* ----------------------------------------------------------------
   Real 3D Calculator — modelado em geometria, sem textura PNG.
   - Corpo: RoundedBox com material vidro/cromo (transmission)
   - Display: caixa preta com emissive cyan + linha de waveform
   - Botões: RoundedBox roxo/azul com emissive
---------------------------------------------------------------- */

function WaveformLine() {
  const ref = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = (t - 0.5) * 1.6;
      // soma de senos pra parecer um waveform
      const y =
        Math.sin(t * Math.PI * 6) * 0.18 *
          Math.exp(-Math.pow((t - 0.5) * 3, 2)) +
        Math.sin(t * Math.PI * 14) * 0.08 *
          Math.exp(-Math.pow((t - 0.5) * 4, 2));
      points.push(new THREE.Vector3(x, y, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
  });

  return (
    // @ts-ignore drei/three line typing
    <line ref={ref} geometry={geometry} position={[0, 0, 0.06]}>
      <lineBasicMaterial
        color={"#00d4ff"}
        transparent
        opacity={1}
        linewidth={2}
        toneMapped={false}
      />
    </line>
  );
}

function Calculator3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.45;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  // grid de botões 3x3 (último botão é grande, ocupando 2 colunas)
  const buttons: { x: number; y: number; w: number; h: number; color: string; emissive: string }[] = [
    { x: -0.55, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0.55, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: -0.55, y: -0.25, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0, y: -0.25, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    // bottom-left wide
    { x: -0.275, y: -0.7, w: 0.97, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    // bottom-right large (equals)
    { x: 0.55, y: -0.475, w: 0.42, h: 0.77, color: "#5b21b6", emissive: "#8b5cf6" },
  ];

  return (
    <group ref={groupRef}>
      {/* Corpo principal — vidro cromado */}
      <RoundedBox
        args={[1.85, 2.3, 0.42]}
        radius={0.22}
        smoothness={8}
        creaseAngle={0.4}
      >
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.4}
          chromaticAberration={0.05}
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.3}
          temporalDistortion={0.1}
          ior={1.4}
          roughness={0.05}
          color={"#1e3a8a"}
          attenuationDistance={0.8}
          attenuationColor={"#3b82f6"}
        />
      </RoundedBox>

      {/* Borda cromada externa (anel sutil) */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.1, 0.018, 16, 100]} />
        <meshStandardMaterial
          color={"#60a5fa"}
          metalness={1}
          roughness={0.15}
          emissive={"#3b82f6"}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Display preto com glow */}
      <group position={[0, 0.78, 0.215]}>
        <RoundedBox args={[1.55, 0.55, 0.04]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={"#020617"}
            metalness={0.2}
            roughness={0.3}
            emissive={"#0a0f2c"}
            emissiveIntensity={0.6}
          />
        </RoundedBox>

        {/* glow interno do display */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.45, 0.45]} />
          <meshBasicMaterial
            color={"#001a33"}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <WaveformLine />
      </group>

      {/* Botões */}
      <group position={[0, -0.15, 0.215]}>
        {buttons.map((b, i) => (
          <group key={i} position={[b.x, b.y, 0]}>
            <RoundedBox args={[b.w, b.h, 0.06]} radius={0.05} smoothness={4}>
              <meshStandardMaterial
                color={b.color}
                metalness={0.6}
                roughness={0.25}
                emissive={b.emissive}
                emissiveIntensity={0.25}
              />
            </RoundedBox>
            {/* highlight sheen */}
            <mesh position={[-b.w * 0.18, b.h * 0.18, 0.034]}>
              <planeGeometry args={[b.w * 0.55, b.h * 0.18]} />
              <meshBasicMaterial
                color={"#ffffff"}
                transparent
                opacity={0.18}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

interface Logo3DProps {
  className?: string;
  size?: number;
  /** quando false, ainda há leve flutuação do <Float>, mas sem rotação contínua */
  spin?: boolean;
}

export function Logo3D({ className, size = 200, spin = true }: Logo3DProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 32 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        dpr={[1, 2]}
      >
        {/* iluminação */}
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[4, 5, 5]}
          intensity={1.6}
          color={"#cfe2ff"}
          castShadow
        />
        <directionalLight
          position={[-4, -2, 3]}
          intensity={0.8}
          color={"#a78bfa"}
        />
        <pointLight position={[0, 0, 3]} intensity={0.5} color={"#3b82f6"} />

        <Suspense fallback={null}>
          <Float
            speed={spin ? 1.4 : 0.8}
            rotationIntensity={spin ? 0.0 : 0.6}
            floatIntensity={0.6}
          >
            <Calculator3D />
          </Float>

          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.55}
            scale={5}
            blur={2.4}
            far={2}
            color={"#1e3a8a"}
          />

          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

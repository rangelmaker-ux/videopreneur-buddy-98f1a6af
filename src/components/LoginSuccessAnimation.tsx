import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  RoundedBox,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import * as THREE from "three";

function AnimatedCalculator({ isMobile, onComplete }: { isMobile: boolean; onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const calculatorRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const armsRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  
  const startTime = useRef(0);
  const completed = useRef(false);

  const buttons: { x: number; y: number; w: number; h: number; color: string; emissive: string }[] = [
    { x: -0.55, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0.55, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: -0.55, y: -0.25, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0, y: -0.25, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: -0.275, y: -0.7, w: 0.97, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0.55, y: -0.475, w: 0.42, h: 0.77, color: "#5b21b6", emissive: "#8b5cf6" },
  ];

  useFrame((state) => {
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    if (!groupRef.current || !calculatorRef.current) return;

    // Phase 1: 0-1s - Focus and Awakening
    if (elapsed < 1) {
      const p = elapsed / 1;
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, 0, 0.1);
      if (eyesRef.current) {
        eyesRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0.5, 1));
      }
    } 
    // Phase 2: 1-2s - The Equipment (Arms and Cinema Camera)
    else if (elapsed < 2) {
      const p = (elapsed - 1) / 1;
      if (armsRef.current) {
        armsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0, 0.8));
      }
      if (cameraRef.current) {
        cameraRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0, 1));
        const cameraZ = THREE.MathUtils.lerp(-1, 0.7, THREE.MathUtils.smoothstep(p, 0.2, 0.8));
        cameraRef.current.position.set(0, 0, cameraZ);
      }
    } 
    // Phase 3: 2-5s - Ninja Walk and Perfect Stabilization
    else if (elapsed < 5.5) {
      const p = (elapsed - 2) / 3;
      
      // Rotate body 90 degrees to the right
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, Math.PI / 2, 0.1);
      
      if (legsRef.current) {
        legsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(elapsed, 2, 2.3));
      }

      // Movement to the right
      const exitDistance = isMobile ? 8 : 12;
      groupRef.current.position.x = THREE.MathUtils.smoothstep(p, 0, 1) * exitDistance;

      // Ninja Walk Bobbing (Heel-to-toe roll simulation)
      const walkSpeed = 10;
      const bobbing = Math.abs(Math.sin((elapsed - 2) * walkSpeed)) * 0.15;
      calculatorRef.current.position.y = -bobbing;
      
      // Stabilization (Camera remains locked in global Y space)
      if (cameraRef.current) {
        // Counter-act the parent's bobbing precisely
        cameraRef.current.position.y = 0.78 + bobbing;
        // Keep camera facing forward even though body turned 90deg
        cameraRef.current.rotation.y = -Math.PI / 2;
      }

      // Finish
      if (elapsed > 5.2 && !completed.current) {
        completed.current = true;
        onComplete();
      }
    }
  });

  return (
    <group ref={groupRef} scale={isMobile ? 0.65 : 1}>
      <group ref={calculatorRef}>
        {/* Main Body */}
        <RoundedBox args={[1.85, 2.3, 0.42]} radius={0.22} smoothness={8}>
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={0.4}
            chromaticAberration={0.05}
            ior={1.4}
            roughness={0.05}
            color={"#020617"}
            attenuationDistance={0.8}
            attenuationColor={"#3b82f6"}
          />
        </RoundedBox>

        {/* Display with LED Eyes */}
        <group position={[0, 0.78, 0.215]}>
          <RoundedBox args={[1.55, 0.55, 0.04]} radius={0.08} smoothness={4}>
            <meshStandardMaterial color={"#020617"} emissive={"#0a0f2c"} emissiveIntensity={0.6} />
          </RoundedBox>
          
          <group ref={eyesRef} scale={0}>
            {/* Recording Status LED Look */}
            <mesh position={[-0.4, 0, 0.03]}>
              <planeGeometry args={[0.2, 0.08]} />
              <meshStandardMaterial color={"#ff0000"} emissive={"#ff0000"} emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <mesh position={[0.4, 0, 0.03]}>
              <planeGeometry args={[0.2, 0.08]} />
              <meshStandardMaterial color={"#ff0000"} emissive={"#ff0000"} emissiveIntensity={2} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* Buttons */}
        <group position={[0, -0.15, 0.215]}>
          {buttons.map((b, i) => (
            <group key={i} position={[b.x, b.y, 0]}>
              <RoundedBox args={[b.w, b.h, 0.06]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={b.color} emissive={b.emissive} emissiveIntensity={0.25} />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* Arms (Carbon Fiber style) */}
        <group ref={armsRef} scale={0}>
          <group position={[-1.1, 0, 0]} rotation={[0, 0, 0.4]}>
            <RoundedBox args={[0.1, 1, 0.1]} radius={0.05}>
              <meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />
            </RoundedBox>
          </group>
          <group position={[1.1, 0, 0]} rotation={[0, 0, -0.4]}>
            <RoundedBox args={[0.1, 1, 0.1]} radius={0.05}>
              <meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />
            </RoundedBox>
          </group>
        </group>

        {/* Ninja Legs */}
        <group ref={legsRef} scale={0} position={[0, -1.2, 0]}>
          <group position={[-0.5, -0.4, 0]} rotation={[0.4, 0, 0]}>
            <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.05}>
              <meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />
            </RoundedBox>
          </group>
          <group position={[0.5, -0.4, 0]} rotation={[0.4, 0, 0]}>
            <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.05}>
              <meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />
            </RoundedBox>
          </group>
        </group>
      </group>

      {/* Professional Cinema Camera (Stabilized) */}
      <group ref={cameraRef} scale={0} position={[0, 0.78, 0.7]}>
        {/* Main Body (Matte Black) */}
        <RoundedBox args={[0.6, 0.5, 0.4]} radius={0.05}>
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </RoundedBox>
        {/* Cinema Lens (Chrome/Glass) */}
        <group position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
          <meshStandardMaterial color="#334155" metalness={1} roughness={0.1} />
          {/* Lens Glass */}
          <mesh position={[0, 0.21, 0]}>
            <circleGeometry args={[0.12, 32]} />
            <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>
        </group>
        {/* Matte Box */}
        <group position={[0, 0, 0.55]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#020617" />
        </group>
        {/* Top Handle */}
        <group position={[0, 0.35, 0]}>
          <RoundedBox args={[0.1, 0.1, 0.4]} radius={0.02}>
            <meshStandardMaterial color="#1e293b" />
          </RoundedBox>
        </group>
      </group>
    </group>
  );
}

interface LoginSuccessAnimationProps {
  onComplete: () => void;
}

export function LoginSuccessAnimation({ onComplete }: LoginSuccessAnimationProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative h-full w-full">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 35 }}
          gl={{ alpha: true, antialias: true, stencil: false, depth: true }}
          dpr={[1, 2]}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-5, 5, 2]} intensity={1} color="#cfe2ff" />
          <pointLight position={[0, 0, 4]} intensity={0.8} color="#3b82f6" />
          
          <Suspense fallback={null}>
            <AnimatedCalculator isMobile={isMobile} onComplete={onComplete} />
            <ContactShadows position={[0, -2, 0]} opacity={0.3} scale={12} blur={2} far={4} />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="absolute bottom-10 right-10 z-[110] text-[11px] font-light uppercase tracking-widest text-white/40 transition-all hover:text-white/100"
        >
          Pular animação
        </button>
      </div>
    </div>
  );
}

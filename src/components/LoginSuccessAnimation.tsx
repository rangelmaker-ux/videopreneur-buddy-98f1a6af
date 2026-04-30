import { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  RoundedBox,
  MeshTransmissionMaterial,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";

// Reusing the calculator logic but with animation hooks
function AnimatedCalculator({ isMobile, onComplete }: { isMobile: boolean; onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const calculatorRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const armsRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  
  const [phase, setPhase] = useState(0); // 0: focusing, 1: awakening, 2: arms/camera, 3: walking
  const startTime = useRef(0);
  const completed = useRef(false);

  // Constants for parts
  const buttons: { x: number; y: number; w: number; h: number; color: string; emissive: string }[] = [
    { x: -0.55, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0.55, y: 0.2, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: -0.55, y: -0.25, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0, y: -0.25, w: 0.42, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: -0.275, y: -0.7, w: 0.97, h: 0.32, color: "#1e2a5e", emissive: "#3b82f6" },
    { x: 0.55, y: -0.475, w: 0.42, h: 0.77, color: "#5b21b6", emissive: "#8b5cf6" },
  ];

  useFrame((state, delta) => {
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    if (!groupRef.current || !calculatorRef.current) return;

    // Sequence timing
    if (elapsed < 1) {
      // 0-1s: Parada e Foco
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, 0, 0.15);
      calculatorRef.current.rotation.x = THREE.MathUtils.lerp(calculatorRef.current.rotation.x, 0, 0.15);
      calculatorRef.current.rotation.z = THREE.MathUtils.lerp(calculatorRef.current.rotation.z, 0, 0.15);
    } else if (elapsed < 2) {
      // 1-2s: Despertar
      if (eyesRef.current) {
        eyesRef.current.scale.setScalar(THREE.MathUtils.smoothstep(elapsed, 1, 1.3));
        
        // Piscar aos 1.5s
        if (elapsed > 1.4 && elapsed < 1.6) {
          const blinkScale = 1 - Math.sin((elapsed - 1.4) * Math.PI * 5) * 0.9;
          leftEyeRef.current?.scale.set(1, blinkScale, 1);
          rightEyeRef.current?.scale.set(1, blinkScale, 1);
        } else {
          leftEyeRef.current?.scale.set(1, 1, 1);
          rightEyeRef.current?.scale.set(1, 1, 1);
        }
      }
    } else if (elapsed < 3) {
      // 2-3s: Ação Inesperada (Braços e Câmera)
      if (armsRef.current) {
        armsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(elapsed, 2, 2.3));
        armsRef.current.position.z = THREE.MathUtils.lerp(-0.2, 0, THREE.MathUtils.smoothstep(elapsed, 2, 2.3));
      }
      if (cameraRef.current) {
        cameraRef.current.scale.setScalar(THREE.MathUtils.smoothstep(elapsed, 2.2, 2.6));
        // Move camera to front of eye
        cameraRef.current.position.set(0.4, 0.78, 0.5);
      }
    } else if (elapsed < 5.5) {
      // 3-5.5s: A Saída do Videomaker
      if (legsRef.current) {
        legsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(elapsed, 3, 3.2));
      }

      // Movement
      const moveProgress = THREE.MathUtils.smoothstep(elapsed, 3.2, 5.2);
      const exitDistance = isMobile ? 8 : 12;
      groupRef.current.position.x = moveProgress * exitDistance;

      // Walking bobbing (ninja walk)
      const walkSpeed = 12;
      const bobbing = Math.abs(Math.sin(elapsed * walkSpeed)) * 0.15;
      calculatorRef.current.position.y = -bobbing;
      
      // Stabilization (camera stays flat)
      if (cameraRef.current) {
        cameraRef.current.position.y = 0.78 + bobbing; // Counter-act bobbing
      }

      if (elapsed > 5.2 && !completed.current) {
        completed.current = true;
        onComplete();
      }
    }
  });

  return (
    <group ref={groupRef} scale={isMobile ? 0.7 : 1}>
      <group ref={calculatorRef}>
        {/* Corpo principal */}
        <RoundedBox args={[1.85, 2.3, 0.42]} radius={0.22} smoothness={8}>
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={0.4}
            chromaticAberration={0.05}
            ior={1.4}
            roughness={0.05}
            color={"#1e3a8a"}
            attenuationDistance={0.8}
            attenuationColor={"#3b82f6"}
          />
        </RoundedBox>

        {/* Display */}
        <group position={[0, 0.78, 0.215]}>
          <RoundedBox args={[1.55, 0.55, 0.04]} radius={0.08} smoothness={4}>
            <meshStandardMaterial color={"#020617"} emissive={"#0a0f2c"} emissiveIntensity={0.6} />
          </RoundedBox>
          
          {/* Eyes */}
          <group ref={eyesRef} scale={0}>
            <mesh ref={leftEyeRef} position={[-0.4, 0, 0.03]}>
              <planeGeometry args={[0.25, 0.1]} />
              <meshStandardMaterial color={"#00d4ff"} emissive={"#00d4ff"} emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <mesh ref={rightEyeRef} position={[0.4, 0, 0.03]}>
              <planeGeometry args={[0.25, 0.1]} />
              <meshStandardMaterial color={"#00d4ff"} emissive={"#00d4ff"} emissiveIntensity={2} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* Botões */}
        <group position={[0, -0.15, 0.215]}>
          {buttons.map((b, i) => (
            <group key={i} position={[b.x, b.y, 0]}>
              <RoundedBox args={[b.w, b.h, 0.06]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={b.color} emissive={b.emissive} emissiveIntensity={0.25} />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* Arms */}
        <group ref={armsRef} scale={0} position={[0, 0, -0.1]}>
          {/* Left Arm */}
          <group position={[-1, 0, 0]} rotation={[0, 0, 0.5]}>
            <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.05}>
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </RoundedBox>
          </group>
          {/* Right Arm */}
          <group position={[1, 0, 0]} rotation={[0, 0, -0.5]}>
            <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.05}>
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </RoundedBox>
          </group>
        </group>

        {/* Legs */}
        <group ref={legsRef} scale={0} position={[0, -1.15, 0]}>
          {/* Left Leg */}
          <group position={[-0.4, -0.3, 0]} rotation={[0.2, 0, 0]}>
            <RoundedBox args={[0.2, 0.6, 0.2]} radius={0.05}>
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </RoundedBox>
          </group>
          {/* Right Leg */}
          <group position={[0.4, -0.3, 0]} rotation={[-0.2, 0, 0]}>
            <RoundedBox args={[0.2, 0.6, 0.2]} radius={0.05}>
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </RoundedBox>
          </group>
        </group>
      </group>

      {/* Camera (positioned independently to handle stabilization) */}
      <group ref={cameraRef} scale={0}>
        {/* Main Body */}
        <RoundedBox args={[0.5, 0.4, 0.3]} radius={0.04}>
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </RoundedBox>
        {/* Lens */}
        <group position={[0, 0, 0.2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.3, 32]} />
          <meshStandardMaterial color="#334155" metalness={1} roughness={0.2} />
        </group>
        {/* Viewfinder/Top */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
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
          camera={{ position: [0, 0, 5], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#cfe2ff" />
          <pointLight position={[0, 0, 3]} intensity={0.8} color="#3b82f6" />
          
          <Suspense fallback={null}>
            <AnimatedCalculator isMobile={isMobile} onComplete={onComplete} />
            <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
            <Environment preset="city" />
          </Suspense>
        </Canvas>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="absolute bottom-8 right-8 z-[110] rounded-full bg-black/20 px-6 py-3 text-sm font-medium text-white/80 backdrop-blur-md transition-all hover:bg-black/40 hover:text-white"
        >
          Pular animação {">>"}
        </button>
      </div>
    </div>
  );
}

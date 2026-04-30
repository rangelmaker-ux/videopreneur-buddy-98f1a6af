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
  const cameraGroupRef = useRef<THREE.Group>(null);
  const gimbalRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  
  const startTime = useRef(0);
  const completed = useRef(false);

  const buttons: { x: number; y: number; w: number; h: number; color: string; emissive: string }[] = [
    { x: -0.55, y: 0.2, w: 0.42, h: 0.32, color: "#0f172a", emissive: "#3b82f6" },
    { x: 0, y: 0.2, w: 0.42, h: 0.32, color: "#0f172a", emissive: "#3b82f6" },
    { x: 0.55, y: 0.2, w: 0.42, h: 0.32, color: "#0f172a", emissive: "#3b82f6" },
    { x: -0.55, y: -0.25, w: 0.42, h: 0.32, color: "#0f172a", emissive: "#3b82f6" },
    { x: 0, y: -0.25, w: 0.42, h: 0.32, color: "#0f172a", emissive: "#3b82f6" },
    { x: -0.275, y: -0.7, w: 0.97, h: 0.32, color: "#0f172a", emissive: "#3b82f6" },
    { x: 0.55, y: -0.475, w: 0.42, h: 0.77, color: "#312e81", emissive: "#4f46e5" },
  ];

  useFrame((state) => {
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    if (!groupRef.current || !calculatorRef.current) return;

    // Phase 1: 0-1s - Smooth Stop and Awakening
    if (elapsed < 1) {
      const p = elapsed / 1;
      const easing = 1 - Math.pow(1 - p, 3); // ease-out
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, 0, easing * 0.1);
      if (eyesRef.current) {
        eyesRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0.4, 1));
      }
    } 
    // Phase 2: 1-2s - Reveal Arms and Cinema Camera/Gimbal
    else if (elapsed < 2) {
      const p = (elapsed - 1) / 1;
      if (armsRef.current) {
        armsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0, 1));
      }
      if (cameraGroupRef.current) {
        cameraGroupRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0, 1));
        const cameraZ = THREE.MathUtils.lerp(-1, 0.8, THREE.MathUtils.smoothstep(p, 0, 1));
        cameraGroupRef.current.position.z = cameraZ;
      }
    } 
    // Phase 3: 2-10s - Ninja Walk and Perfect Stabilization (Looong and Cinematic)
    else if (elapsed < 10.5) {
      const p = (elapsed - 2) / 8; // 0 to 1 over 8 seconds (Slow movement)
      
      // Turn 90 degrees to profile
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, Math.PI / 2, 0.05);
      
      if (legsRef.current) {
        legsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(elapsed, 2, 2.3));
      }

      // Movement to the right (Cinematic exit)
      const exitDistance = isMobile ? 8 : 15;
      groupRef.current.position.x = THREE.MathUtils.smoothstep(p, 0, 1) * exitDistance;

      // Ninja Walk Bobbing (Extremely controlled and slow)
      const walkCycleSpeed = 6; // Slower steps
      const bobbingAmount = 0.15; // Deeper flexion
      const bobbing = Math.abs(Math.sin((elapsed - 2) * walkCycleSpeed)) * bobbingAmount;
      calculatorRef.current.position.y = -bobbing;
      
      // Perfect Stabilization
      if (cameraGroupRef.current) {
        // Stabilize Y: Counter-act parent bobbing precisely to keep camera on a flat line
        cameraGroupRef.current.position.y = 0.78 + bobbing;
        // Keep camera facing forward relative to movement path (90deg offset from body)
        cameraGroupRef.current.rotation.y = -Math.PI / 2;
      }

      // Finish at 10s
      if (elapsed > 10.1 && !completed.current) {
        completed.current = true;
        onComplete();
      }
    }
  });

  return (
    <group ref={groupRef} scale={isMobile ? 0.6 : 0.9}>
      <group ref={calculatorRef}>
        {/* Main Body - Dark & Premium */}
        <RoundedBox args={[1.85, 2.3, 0.42]} radius={0.18} smoothness={8}>
          <meshStandardMaterial 
            color="#0f172a" 
            metalness={0.9} 
            roughness={0.1}
            emissive="#1e293b"
            emissiveIntensity={0.2}
          />
        </RoundedBox>

        {/* Display with Recording LED Eyes */}
        <group position={[0, 0.78, 0.215]}>
          <RoundedBox args={[1.55, 0.55, 0.05]} radius={0.06} smoothness={4}>
            <meshStandardMaterial color="#020617" emissive="#000000" />
          </RoundedBox>
          
          <group ref={eyesRef} scale={0}>
            {/* Status LED "Eyes" - Recording Red */}
            <mesh position={[-0.4, 0, 0.03]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
            <mesh position={[0.4, 0, 0.03]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
            {/* Glow light */}
            <pointLight position={[0, 0, 0.2]} distance={1} intensity={1} color="#ff0000" />
          </group>
        </group>

        {/* Premium Buttons */}
        <group position={[0, -0.15, 0.215]}>
          {buttons.map((b, i) => (
            <group key={i} position={[b.x, b.y, 0]}>
              <RoundedBox args={[b.w, b.h, 0.08]} radius={0.04} smoothness={4}>
                <meshStandardMaterial color={b.color} emissive={b.emissive} emissiveIntensity={0.2} />
              </RoundedBox>
            </group>
          ))}
        </group>

        {/* Mechanical Arms */}
        <group ref={armsRef} scale={0}>
          {/* Left Arm holding Gimbal handle */}
          <group position={[-1.1, 0, 0.1]} rotation={[0.2, 0, 0.5]}>
            <RoundedBox args={[0.12, 1.2, 0.12]} radius={0.06}>
              <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.2} />
            </RoundedBox>
          </group>
          {/* Right Arm */}
          <group position={[1.1, 0, 0.1]} rotation={[0.2, 0, -0.5]}>
            <RoundedBox args={[0.12, 1.2, 0.12]} radius={0.06}>
              <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.2} />
            </RoundedBox>
          </group>
        </group>

        {/* Ninja Legs (Bent for low center of gravity) */}
        <group ref={legsRef} scale={0} position={[0, -1.1, 0]}>
          <group position={[-0.6, -0.4, 0]} rotation={[0.5, 0, 0.2]}>
            <RoundedBox args={[0.18, 0.9, 0.18]} radius={0.05}>
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </RoundedBox>
          </group>
          <group position={[0.6, -0.4, 0]} rotation={[0.5, 0, -0.2]}>
            <RoundedBox args={[0.18, 0.9, 0.18]} radius={0.05}>
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </RoundedBox>
          </group>
        </group>
      </group>

      {/* STABILIZED SYSTEM: Gimbal + Cinema Camera */}
      <group ref={cameraGroupRef} scale={0} position={[0, 0.78, 0.8]}>
        {/* Gimbal Structure (DJI Style) */}
        <group ref={gimbalRef}>
          {/* Vertical Arm */}
          <group position={[0, -0.4, 0]}>
            <RoundedBox args={[0.08, 0.8, 0.08]} radius={0.04}>
              <meshStandardMaterial color="#334155" metalness={1} />
            </RoundedBox>
          </group>
          <group position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
             <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
             <meshStandardMaterial color="#1e293b" metalness={1} />
          </group>

          {/* Cinema Camera Body */}
          <group position={[0, 0, 0]}>
            <RoundedBox args={[0.6, 0.55, 0.5]} radius={0.05}>
              <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.3} />
            </RoundedBox>
            
            {/* Professional Cinema Lens */}
            <group position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.5, 32]} />
              <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.1} />
              {/* Glass Element with reflections */}
              <mesh position={[0, 0.26, 0]}>
                <circleGeometry args={[0.15, 32]} />
                <meshStandardMaterial 
                  color="#1e3a8a" 
                  emissive="#3b82f6" 
                  emissiveIntensity={0.8} 
                  metalness={1} 
                  roughness={0} 
                />
              </mesh>
            </group>

            {/* Matte Box (Professional Accessory) */}
            <group position={[0, 0, 0.65]}>
              <boxGeometry args={[0.65, 0.6, 0.15]} />
              <meshStandardMaterial color="#000000" metalness={0.5} />
            </group>

            {/* Top Monitor (Small LED Screen) */}
            <group position={[0, 0.45, 0]} rotation={[-0.2, 0, 0]}>
              <RoundedBox args={[0.4, 0.25, 0.05]} radius={0.02}>
                <meshStandardMaterial color="#1e293b" />
              </RoundedBox>
              <mesh position={[0, 0, 0.026]}>
                <planeGeometry args={[0.35, 0.2]} />
                <meshStandardMaterial color="#000000" emissive="#3b82f6" emissiveIntensity={0.5} />
              </mesh>
            </group>

            {/* High-end Details: Knobs & Ports */}
            <group position={[0.31, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
              <meshStandardMaterial color="#475569" />
            </group>

          </group>
        </group>
        
        {/* Cinematic Highlight Lights */}
        <pointLight position={[0.5, 0.5, 1]} intensity={1.5} color="#ffffff" distance={2} />
        <pointLight position={[-0.5, -0.5, 1]} intensity={1} color="#3b82f6" distance={2} />
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

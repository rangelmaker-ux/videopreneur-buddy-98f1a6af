import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  RoundedBox,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

function AnimatedCalculator({ isMobile, onComplete, volume }: { isMobile: boolean; onComplete: () => void; volume: number }) {
  const playFlashSound = (vol: number) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContext.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      const noise = ctx.createBufferSource();
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
      noise.start();
      noise.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio error", e);
    }
  };
  const groupRef = useRef<THREE.Group>(null);
  const calculatorRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const armsRef = useRef<THREE.Group>(null);
  const cameraGroupRef = useRef<THREE.Group>(null);
  const gimbalRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  const capeRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  
  const startTime = useRef(0);
  const completed = useRef(false);
  const flashSoundPlayed = useRef(false);
  const techSoundPlayed = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const techOscillators = useRef<any[]>([]);

  const playTechSound = (vol: number) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContext.current;
      
      // Layer 1: Ambient futuristic drone
      const drone = ctx.createOscillator();
      const droneGain = ctx.createGain();
      drone.type = 'sawtooth';
      drone.frequency.setValueAtTime(40, ctx.currentTime);
      drone.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 2);
      
      droneGain.gain.setValueAtTime(0, ctx.currentTime);
      droneGain.gain.linearRampToValueAtTime(vol * 0.1, ctx.currentTime + 0.5);
      droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
      
      // Filter for that "tech" feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2);
      
      drone.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(ctx.destination);
      
      drone.start();
      drone.stop(ctx.currentTime + 2.5);

      // Layer 2: Fast tech blips
      const playBlip = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        g.gain.setValueAtTime(0, ctx.currentTime + time);
        g.gain.linearRampToValueAtTime(vol * 0.05, ctx.currentTime + time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.1);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.1);
      };

      [0.2, 0.5, 0.8, 1.2, 1.5].forEach((t, i) => {
        playBlip(t, 440 + i * 220);
      });

    } catch (e) {
      console.error("Tech sound error", e);
    }
  };
  
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
      if (!techSoundPlayed.current) {
        techSoundPlayed.current = true;
        playTechSound(volume);
      }
      const p = elapsed / 1;
      const easing = 1 - Math.pow(1 - p, 3); // ease-out
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, 0, easing * 0.1);
      if (eyesRef.current) {
        eyesRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0.4, 1));
      }
    }
    // Phase 2: 1-2s - Reveal Arms and Cinema Camera/Gimbal (Now in FRONT)
    else if (elapsed < 2) {
      const p = (elapsed - 1) / 1;
      if (armsRef.current) {
        armsRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0, 1));
      }
      if (cameraGroupRef.current) {
        cameraGroupRef.current.scale.setScalar(THREE.MathUtils.smoothstep(p, 0, 1));
        // Move to FRONT: Z goes from 0 to 1.4
        cameraGroupRef.current.position.z = THREE.MathUtils.lerp(0, 1.4, p);
        // Position at Chest/Waist level
        cameraGroupRef.current.position.y = THREE.MathUtils.lerp(0, -0.3, p);
      }
    } 
    // Phase 3: 2-4s - Flash and Hero Takeoff!
    else if (elapsed < 4.5) {
      const takeoffElapsed = elapsed - 2;
      const p = takeoffElapsed / 2; // Progress of flight (0 to 1 over 2 seconds)
      
      // Flash logic: quick intense burst at the very start (2.0s to 2.3s)
      if (takeoffElapsed < 0.3) {
        if (!flashSoundPlayed.current) {
          flashSoundPlayed.current = true;
          playFlashSound(volume);
        }
        if (flashRef.current) {
          // Stronger intensity (150) and a peak-hold-fade curve
          const flashP = takeoffElapsed / 0.3;
          flashRef.current.intensity = Math.pow(1 - flashP, 2) * 150;
        }
      } else if (flashRef.current) {
        flashRef.current.intensity = 0;
      }
      
      // Face forward for flight
      calculatorRef.current.rotation.y = THREE.MathUtils.lerp(calculatorRef.current.rotation.y, 0, 0.1);
      
      // Red Cape Appearance (Simulated by scaling/positioning if we had a mesh, 
      // but we'll focus on the movement first as requested)
      
      // Super Velocity Flight UP
      // Use an exponential power to simulate "Super Velocity" (acceleration)
      const flyHeight = Math.pow(p * 5, 3); 
      groupRef.current.position.y = flyHeight;
      
      // Lean forward slightly as it speeds up
      calculatorRef.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 4, p);

      // Cape waving — animate vertices to simulate wind
      if (capeRef.current) {
        const geo = capeRef.current.geometry as THREE.PlaneGeometry;
        const pos = geo.attributes.position;
        const time = elapsed * 6;
        const intensity = 0.15 + p * 0.35; // stronger as speed increases
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          // Wind ripple: stronger toward bottom of cape (lower y)
          const distFromTop = (1.25 - y) / 2.5; // 0 at top, 1 at bottom
          const wave =
            Math.sin(y * 3 + time) * 0.12 * distFromTop +
            Math.sin(x * 2.5 + time * 1.3) * 0.08 * distFromTop;
          pos.setZ(i, wave * intensity * 4);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        // Trail backward as it accelerates upward
        capeRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.6, p);
      }

      // Camera stays with the hero but fades out
      if (cameraGroupRef.current) {
        cameraGroupRef.current.scale.setScalar(1 - p);
      }

      // Finish and redirect when high enough
      if (p > 0.95 && !completed.current) {
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

        {/* Super Hero Cape (Red) - segmented plane for waving */}
        <group position={[0, 0, -0.22]} ref={armsRef} scale={0}>
          <mesh ref={capeRef} position={[0, -0.2, -0.1]} rotation={[0, 0, 0]}>
            <planeGeometry args={[1.6, 2.5, 12, 20]} />
            <meshStandardMaterial
              color="#dc2626"
              roughness={0.45}
              metalness={0.1}
              side={THREE.DoubleSide}
              emissive="#7f1d1d"
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>

        {/* Legs retracted for flight */}
        <group ref={legsRef} scale={0} position={[0, -1.1, 0]}>
          <group position={[-0.4, -0.2, 0]} rotation={[0.1, 0, 0]}>
            <RoundedBox args={[0.18, 0.5, 0.18]} radius={0.05}>
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </RoundedBox>
          </group>
          <group position={[0.4, -0.2, 0]} rotation={[0.1, 0, 0]}>
            <RoundedBox args={[0.18, 0.5, 0.18]} radius={0.05}>
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </RoundedBox>
          </group>
        </group>
      </group>

      {/* STABILIZED SYSTEM: Gimbal + Cinema Camera */}
      <group ref={cameraGroupRef} scale={0} position={[0, -0.3, 1.4]}>
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
              {/* Flash Light Source */}
              <pointLight ref={flashRef} position={[0, 0.3, 0]} intensity={0} color="#ffffff" distance={10} />
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
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

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
            <AnimatedCalculator isMobile={isMobile} onComplete={onComplete} volume={isMuted ? 0 : volume} />
            <ContactShadows position={[0, -2, 0]} opacity={0.3} scale={12} blur={2} far={4} />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>

        {/* Volume Control */}
        <div className="absolute top-10 right-10 z-[110] flex items-center gap-4 bg-black/20 backdrop-blur-md p-3 rounded-full border border-white/10 group">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          
          <div className="w-24 opacity-0 group-hover:opacity-100 transition-opacity">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(vals) => {
                setVolume(vals[0]);
                if (vals[0] > 0) setIsMuted(false);
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="absolute bottom-10 right-10 z-[110] text-[11px] font-light uppercase tracking-widest text-white/30 transition-all hover:text-white/80 active:scale-95 sm:bottom-12 sm:right-12"
        >
          Pular animação &gt;&gt;
        </button>
      </div>
    </div>
  );
}

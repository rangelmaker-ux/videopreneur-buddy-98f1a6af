import { useEffect, useRef } from "react";

/**
 * Animated particle background.
 * - Cinema-tech feel: soft glowing dots that drift, twinkle and connect when close.
 * - Uses primary/secondary/accent HSL tokens from index.css.
 */
export function ParticlesBg({ density = 0.00012 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number; tw: number; twS: number };
    let particles: P[] = [];

    const palette = [199, 290, 160, 260]; // hues from design system

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(40, Math.min(140, Math.floor(width * height * density)));
      particles = Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.6,
        hue: palette[Math.floor(Math.random() * palette.length)],
        tw: Math.random() * Math.PI * 2,
        twS: 0.005 + Math.random() * 0.015,
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const max = 110;
          if (d2 < max * max) {
            const alpha = (1 - Math.sqrt(d2) / max) * 0.18;
            ctx.strokeStyle = `hsla(${a.hue}, 95%, 70%, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.twS;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const twinkle = 0.55 + Math.sin(p.tw) * 0.45;
        const r = p.r * (0.9 + twinkle * 0.4);

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
        grad.addColorStop(0, `hsla(${p.hue}, 95%, 75%, ${0.55 * twinkle})`);
        grad.addColorStop(1, `hsla(${p.hue}, 95%, 75%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 100%, 88%, ${0.85 * twinkle})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}

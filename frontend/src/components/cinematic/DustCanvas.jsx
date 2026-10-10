import { useEffect, useRef } from "react";

/**
 * DustCanvas: High-performance 60 FPS Canvas particle engine.
 * Renders microscopic (1-3px) luminous wedding dust particles (champagne, antique gold,
 * ivory, rose gold) with physical drag, upward air current bias, and organic deceleration.
 */
function DustCanvas({ isDissolving, cardBoundsRef }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const ambientParticlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const hasSpawnedDissolutionRef = useRef(false);

  // Initialize subtle ambient background dust (14 tiny particles)
  useEffect(() => {
    const ambient = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      ambient.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.35, // slow upward drift
        size: 0.8 + Math.random() * 1.2,
        alpha: 0.15 + Math.random() * 0.35,
        baseAlpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: 0.8 + Math.random() * 1.5,
        color: i % 2 === 0 ? "245, 230, 195" : "218, 185, 115",
      });
    }
    ambientParticlesRef.current = ambient;
  }, []);

  // Spawn dissolution particles when isDissolving turns true
  useEffect(() => {
    if (!isDissolving || hasSpawnedDissolutionRef.current) return;
    hasSpawnedDissolutionRef.current = true;

    // Get card bounding rectangle or fallback to screen center
    let cardRect = {
      left: window.innerWidth * 0.5 - 170,
      top: window.innerHeight * 0.5 - 230,
      width: 340,
      height: 460,
    };

    if (cardBoundsRef?.current) {
      const rect = cardBoundsRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        cardRect = rect;
      }
    }

    const newParticles = [];
    // 60-70 fine particles for mobile-first smooth 60 FPS
    const particleCount = window.innerWidth < 600 ? 55 : 72;

    const colors = [
      "255, 252, 245", // Pure ivory
      "248, 235, 205", // Champagne
      "222, 190, 120", // Antique gold
      "228, 175, 155", // Soft rose gold
      "255, 240, 210", // Warm pearl
    ];

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles across card edges and surface
      const onEdge = Math.random() < 0.65;
      let px, py;

      if (onEdge) {
        // Place along outer perimeter of stationery
        const perimeter = 2 * (cardRect.width + cardRect.height);
        const dist = Math.random() * perimeter;
        if (dist < cardRect.width) {
          px = cardRect.left + dist;
          py = cardRect.top;
        } else if (dist < cardRect.width + cardRect.height) {
          px = cardRect.left + cardRect.width;
          py = cardRect.top + (dist - cardRect.width);
        } else if (dist < 2 * cardRect.width + cardRect.height) {
          px = cardRect.left + (dist - (cardRect.width + cardRect.height));
          py = cardRect.top + cardRect.height;
        } else {
          px = cardRect.left;
          py = cardRect.top + (dist - (2 * cardRect.width + cardRect.height));
        }
      } else {
        // Distributed across interior card surface
        px = cardRect.left + (0.1 + Math.random() * 0.8) * cardRect.width;
        py = cardRect.top + (0.1 + Math.random() * 0.8) * cardRect.height;
      }

      // Trajectory calculation: gentle outward push + upward air current bias
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      const angle = Math.atan2(py - centerY, px - centerX) + (Math.random() - 0.5) * 0.5;
      const speed = 0.8 + Math.random() * 2.2;

      // Varied delays (0 to 0.65s) so particles peel away progressively
      const delay = Math.random() * 0.65;
      const maxLife = 1.3 + Math.random() * 1.2;

      newParticles.push({
        x: px + (Math.random() - 0.5) * 8,
        y: py + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed * 0.85 + (Math.random() - 0.5) * 0.6,
        vy: -0.6 - Math.random() * 2.0 + Math.sin(angle) * speed * 0.4, // upward drift
        drag: 0.982, // organic deceleration
        size: 1.0 + Math.random() * 1.8, // 1.0 - 2.8px fine specks
        color: colors[i % colors.length],
        alpha: 0,
        targetAlpha: 0.65 + Math.random() * 0.35,
        delay,
        age: 0,
        maxLife,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 2.0 + Math.random() * 3.0,
      });
    }

    particlesRef.current = newParticles;
  }, [isDissolving, cardBoundsRef]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let lastTime = performance.now();

    const handleResize = () => {
      // Limit mobile backing-store resolution to reduce GPU fill cost.
      const maxDpr = window.innerWidth < 600 ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let lastRenderTime = 0;

    const render = (currentTime) => {
      // Keep idle ambience light; restore full refresh during the active reveal.
      const idleFrameInterval = isDissolving ? 0 : 1000 / 30;
      if (
        idleFrameInterval > 0 &&
        currentTime - lastRenderTime < idleFrameInterval
      ) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      lastRenderTime = currentTime;
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // cap delta time
      lastTime = currentTime;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle ambient specks
      const ambient = ambientParticlesRef.current;
      for (let i = 0; i < ambient.length; i++) {
        const p = ambient[i];
        // Keep ambient drift consistent across different frame rates.
        const frameScale = dt * 60;
        p.x += p.vx * frameScale;
        p.y += p.vy * frameScale;

        // Wrap around viewport edges
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const pulse = 0.7 + 0.3 * Math.sin(currentTime * 0.002 * p.pulseSpeed + i);
        ctx.fillStyle = `rgba(${p.color}, ${p.baseAlpha * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw dissolution particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.delay > 0) {
          p.delay -= dt;
          continue;
        }

        p.age += dt;
        if (p.age >= p.maxLife) continue;

        // Fade in rapidly, then smooth exponential fade out
        const progress = p.age / p.maxLife;
        if (progress < 0.15) {
          p.alpha = (progress / 0.15) * p.targetAlpha;
        } else {
          p.alpha = p.targetAlpha * Math.pow(1 - (progress - 0.15) / 0.85, 1.6);
        }

        // Apply drag and curl flutter
        p.vx *= p.drag;
        p.vy *= p.drag;
        const wobble = Math.sin(p.age * p.wobbleSpeed + p.wobblePhase) * 0.35;

        p.x += p.vx + wobble;
        p.y += p.vy;

        if (p.alpha > 0.02) {
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Subtle warm glow halo for larger particles
          if (p.size > 1.8 && p.alpha > 0.4) {
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha * 0.25})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (!document.hidden) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    const startRendering = () => {
      if (animFrameRef.current === null && !document.hidden) {
        lastTime = performance.now();
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else {
        startRendering();
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isDissolving]);

  return (
    <canvas
      ref={canvasRef}
      className="dust-particle-canvas"
      aria-hidden="true"
    />
  );
}

export default DustCanvas;

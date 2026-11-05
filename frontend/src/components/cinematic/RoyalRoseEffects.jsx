import { useEffect, useRef } from "react";
import "./RoyalRoseEffects.css";

const GOLD_PALETTE = [
  [226, 190, 119],
  [247, 225, 176],
  [193, 139, 111],
  [255, 242, 207],
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createParticle(width, height, isShower = false) {
  const [red, green, blue] =
    GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];

  return {
    x: randomBetween(0, width),
    y: isShower ? randomBetween(-height * 0.22, -8) : randomBetween(0, height),
    vx: isShower ? randomBetween(-22, 24) : randomBetween(-5, 5),
    vy: isShower ? randomBetween(75, 190) : randomBetween(3, 15),
    radius: isShower ? randomBetween(0.7, 2.2) : randomBetween(0.55, 1.8),
    opacity: randomBetween(0.32, 0.9),
    phase: randomBetween(0, Math.PI * 2),
    twinkle: randomBetween(0.8, 2.4),
    color: `rgb(${red}, ${green}, ${blue})`,
    isShower,
    age: 0,
    lifetime: isShower ? randomBetween(1.7, 3.1) : Infinity,
  };
}

function RoyalRoseEffects() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = canvas?.parentElement;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !surface || !context) return undefined;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const particles = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let previousFrame = 0;
    let previousScrollY = window.scrollY;
    let previousScrollTime = performance.now();
    let scrollEnergy = 0;
    let showerCooldown = 0;
    let reducedMotion = motionPreference.matches;

    const resize = () => {
      width = surface.clientWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const baseCount = Math.min(260, Math.max(160, Math.round(width * 0.23)));
      const baseParticles = particles.filter((particle) => !particle.isShower);
      particles.length = 0;
      for (let index = 0; index < baseCount; index += 1) {
        particles.push(
          baseParticles[index] || createParticle(width, height)
        );
      }
    };

    const drawParticle = (particle, time) => {
      const shimmer =
        particle.opacity *
        (0.72 + Math.sin(time * particle.twinkle + particle.phase) * 0.28);
      context.globalAlpha = shimmer;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();

      if (particle.radius > 1.55 && shimmer > 0.5) {
        const glow = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 5
        );
        glow.addColorStop(0, `${particle.color.replace("rgb", "rgba").replace(")", ", 0.42)")}`);
        glow.addColorStop(1, "rgba(255, 230, 177, 0)");
        context.globalAlpha = shimmer * 0.62;
        context.fillStyle = glow;
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.radius * 5,
          0,
          Math.PI * 2
        );
        context.fill();
      }
    };

    const drawFrame = (timestamp) => {
      const elapsed = previousFrame
        ? Math.min((timestamp - previousFrame) / 1000, 0.04)
        : 0;
      previousFrame = timestamp;
      context.clearRect(0, 0, width, height);
      const time = timestamp / 1000;

      if (!reducedMotion) {
        scrollEnergy *= Math.pow(0.055, elapsed);
        showerCooldown -= elapsed;
        if (scrollEnergy > 0.09 && showerCooldown <= 0) {
          const burstSize = Math.ceil(3 + scrollEnergy * 7);
          const maxCount = width < 600 ? 210 : 310;
          for (
            let index = 0;
            index < burstSize && particles.length < maxCount;
            index += 1
          ) {
            particles.push(createParticle(width, height, true));
          }
          showerCooldown = 0.085;
        }
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        if (!reducedMotion) {
          particle.x += particle.vx * elapsed;
          particle.y += particle.vy * elapsed;
          if (particle.isShower) particle.age += elapsed;

          if (
            particle.isShower &&
            (particle.age >= particle.lifetime || particle.y > height + 12)
          ) {
            particles.splice(index, 1);
            continue;
          }

          if (!particle.isShower) {
            if (particle.x < -3) particle.x = width + 3;
            if (particle.x > width + 3) particle.x = -3;
            if (particle.y > height + 3) particle.y = -3;
          }
        }
        drawParticle(particle, time);
      }

      context.globalAlpha = 1;
      if (!reducedMotion && !document.hidden) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const handleScroll = () => {
      const now = performance.now();
      const currentY = window.scrollY;
      const elapsed = Math.max(now - previousScrollTime, 16);
      const velocity = Math.abs(currentY - previousScrollY) / elapsed;
      scrollEnergy = Math.min(1, Math.max(scrollEnergy, velocity * 4.5));
      previousScrollY = currentY;
      previousScrollTime = now;
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      previousFrame = 0;
      if (reducedMotion) {
        drawFrame(performance.now());
      } else if (!document.hidden) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const handleMotionChange = (event) => {
      reducedMotion = event.matches;
      startAnimation();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        startAnimation();
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionChange);
    startAnimation();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div className="royal-rose-effects" aria-hidden="true">
      <canvas ref={canvasRef} className="royal-rose-particles" />
      <div className="royal-rose-metallic-sweep" />
      <div className="royal-rose-floral royal-rose-floral-top">
        <i className="rose-leaf leaf-one" />
        <i className="rose-leaf leaf-two" />
        <i className="rose-leaf leaf-three" />
        <span className="rose-bloom bloom-one" />
        <span className="rose-bloom bloom-two" />
        <span className="rose-bloom bloom-three" />
      </div>
      <div className="royal-rose-floral royal-rose-floral-bottom">
        <i className="rose-leaf leaf-one" />
        <i className="rose-leaf leaf-two" />
        <i className="rose-leaf leaf-three" />
        <span className="rose-bloom bloom-one" />
        <span className="rose-bloom bloom-two" />
        <span className="rose-bloom bloom-three" />
      </div>
      <div className="royal-rose-corner royal-rose-corner-top" />
      <div className="royal-rose-corner royal-rose-corner-bottom" />
    </div>
  );
}

export default RoyalRoseEffects;

"use client";

import {
  useMotionValue,
  useTransform,
  motion,
  useScroll,
  useMotionTemplate,
  useSpring,
} from "framer-motion";
import { useRef } from "react";
import React from "react";

// --- Helper Function: Creates one set of dash springs (Unchanged) ---
const createDashSprings = () => {
  const springConfig = { damping: 25, stiffness: 500, mass: 0.5 };
  return {
    x: useSpring(0, springConfig),
    y: useSpring(0, springConfig),
    width: useSpring(0, springConfig),
    height: useSpring(0, springConfig),
    rotate: useSpring(0, springConfig),
  };
};

// --- Truly random shape function (Unchanged) ---
function setRandomShape(dash) {
  const widthRadius = 20 + Math.random() * 80;
  const heightRadius = 20 + Math.random() * 80;
  const rotation = Math.random() * 360;
  dash.width.set(widthRadius);
  dash.height.set(heightRadius);
  dash.rotate.set(rotation);
}

export default function Home() {
  // === Particle Pool & State Refs (Unchanged) ===
  const dashPool = useRef([
    createDashSprings(),
    createDashSprings(),
    createDashSprings(),
    createDashSprings(),
    createDashSprings(),
    createDashSprings(),
    createDashSprings(),
    createDashSprings(),
  ]).current;
  const dashTimeouts = useRef<NodeJS.Timeout[][]>(
    Array(dashPool.length)
      .fill(null)
      .map(() => [])
  ).current;
  const particleIndex = useRef(0);
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);

  // === Motion Values for Mouse (Unchanged) ===
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // === Parallax Transforms (MODIFIED for "super tiny" effect) ===

  // 1. Headshot (Moves a tiny bit)
  const xTranslateHeadshot = useTransform(x, [-600, 600], [-4, 4]);
  const yTranslateHeadshot = useTransform(y, [-400, 400], [-3, 3]);

  // 2. Helmet (Moves even less)
  const xTranslateHelmet = useTransform(x, [-600, 600], [-2, 2]);
  const yTranslateHelmet = useTransform(y, [-400, 400], [-1, 1]);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);

    // --- Simple Throttle (Unchanged) ---
    if (throttleTimer.current) return;
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
    }, 15);

    // --- "Fire" a Particle (Unchanged) ---
    const index = (particleIndex.current + 1) % dashPool.length;
    particleIndex.current = index;
    const currentDash = dashPool[index];
    const currentTimers = dashTimeouts[index];
    currentTimers.forEach(clearTimeout);
    dashTimeouts[index] = [];
    currentDash.x.set(event.clientX - rect.left);
    currentDash.y.set(event.clientY - rect.top);
    setRandomShape(currentDash);
    const lifespan = 300;
    const pulseTimer = setTimeout(() => {
      setRandomShape(currentDash);
    }, lifespan / 2);
    const despawnTimer = setTimeout(() => {
      currentDash.width.set(0);
      currentDash.height.set(0);
    }, lifespan);
    dashTimeouts[index].push(pulseTimer, despawnTimer);
  }

  // === Scroll "Fly-Away" Logic (Unchanged) ===
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const transformTemplate = useMotionTemplate;

  return (
    <div className="flex min-h-[300vh] flex-col items-center bg-white">
      <motion.main
        ref={scrollRef}
        className="relative h-screen w-full"
        onMouseMove={handleMouseMove}
        style={{
          scale,
          opacity,
          isolation: "isolate",
          overflow: "hidden",
        }}
      >
        {/* === NEW: Animated Background Layer (z-0) === */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            // You must provide this image file in your /public folder
            backgroundImage: "url('/topology.png')",
            backgroundSize: "500px", // Or "cover", "auto", etc.
            opacity: 0.05, // Very subtle
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 40, // Very slow pan
            repeat: Infinity,
            repeatType: "mirror", // Pan back and forth
            ease: "linear",
          }}
        />

        {/* === SVG MASK DEFINITION (Unchanged) === */}
        <svg className="absolute left-0 top-0 h-0 w-0" aria-hidden="true">
          <defs>
            <mask id="particle-mask">
              <rect width="100%" height="100%" fill="black" />
              {dashPool.map((dash, i) => (
                <motion.ellipse
                  key={i}
                  fill="white"
                  cx={dash.x}
                  cy={dash.y}
                  rx={dash.width}
                  ry={dash.height}
                  transform={transformTemplate`rotate(${dash.rotate} ${dash.x} ${dash.y})`}
                />
              ))}
            </mask>
          </defs>
        </svg>

        {/* === LAYER 1 (z-10) - Headshot Face (Moves) === */}
        <motion.img
          src="/headshot_transparent.png"
          alt="Headshot Face"
          className="absolute inset-0 z-10 h-full w-full object-contain"
          style={{
            x: xTranslateHeadshot,
            y: yTranslateHeadshot,
          }}
        />

        {/* --- Bust layer removed --- */}

        {/* === LAYER 2 (z-20) - Base Outline (Moves) === */}
        <motion.img
          src="/helmet.png"
          alt="Helmet Outline"
          className="absolute inset-0 z-20 h-full w-full object-contain opacity-10"
          style={{
            x: xTranslateHelmet,
            y: yTranslateHelmet,
          }}
        />

        {/* === LAYER 2.5 (z-20) - The Glow Scan (Moves) === */}
        <motion.div
          className="absolute inset-0 z-20 h-full w-full overflow-hidden"
          style={{
            maskImage: "url(/helmet.png)",
            WebkitMaskImage: "url(/helmet.png)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            x: xTranslateHelmet,
            y: yTranslateHelmet,
          }}
        >
          <motion.div
            className="absolute inset-0 h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(175deg, transparent 40%, white 50%, transparent 60%)",
              mixBlendMode: "plus-lighter",
              opacity: 0.4,
            }}
            animate={{ y: ["-100%", "200%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* === LAYER 3 (z-30) - Helmet Reveal (Moves) === */}
        <motion.img
          src="/helmet.png"
          alt="Helmet Reveal"
          className="absolute inset-0 z-30 h-full w-full object-contain"
          style={{
            maskImage: "url(#particle-mask)",
            WebkitMaskImage: "url(#particle-mask)",
            x: xTranslateHelmet,
            y: yTranslateHelmet,
          }}
        />
      </motion.main>

      <div className="h-screen text-black">
        <p className="pt-24 text-center">More page content here</p>
      </div>
    </div>
  );
}

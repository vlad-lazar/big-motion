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
// This import should now work correctly
import { AnimatedTopologyBackground } from "./AnimatedTopology";

// --- Helper Function: Creates one set of dash springs ---
const createDashSprings = () => {
  // No change here
  const springConfig = { damping: 25, stiffness: 500, mass: 0.5 };
  return {
    x: useSpring(0, springConfig),
    y: useSpring(0, springConfig),
    width: useSpring(0, springConfig),
    height: useSpring(0, springConfig),
    rotate: useSpring(0, springConfig),
  };
};

// --- Truly random shape function ---
function setRandomShape(dash: any) {
  // No change here
  const widthRadius = 20 + Math.random() * 80;
  const heightRadius = 20 + Math.random() * 80;
  const rotation = Math.random() * 360;
  dash.width.set(widthRadius);
  dash.height.set(heightRadius);
  dash.rotate.set(rotation);
}

// +++ NEW SUB-COMPONENT TO FIX THE ERROR +++
// This component safely clamps the spring values
const ParticleEllipse = ({ dash }: { dash: any }) => {
  // useTransform will pipe the spring's value through Math.max
  // ensuring it can never be negative.
  const safeWidth = useTransform(dash.width, (v) => Math.max(0, v));
  const safeHeight = useTransform(dash.height, (v) => Math.max(0, v));
  const transformTemplate = useMotionTemplate;

  return (
    <motion.ellipse
      fill="white"
      cx={dash.x}
      cy={dash.y}
      rx={safeWidth} // <-- Use the safe value
      ry={safeHeight} // <-- Use the safe value
      transform={transformTemplate`rotate(${dash.rotate} ${dash.x} ${dash.y})`}
    />
  );
};
// +++++++++++++++++++++++++++++++++++++++++++

// === THIS IS YOUR COMPONENT ===
export default function HeroFrame() {
  // === Particle Pool & State Refs ===
  // No change here
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

  // No change here
  const dashTimeouts = useRef<ReturnType<typeof setTimeout>[][]>(
    Array(dashPool.length)
      .fill(null)
      .map(() => [])
  ).current;
  const particleIndex = useRef(0);
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === Motion Values for Mouse ===
  // No change here
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // === Parallax Transforms ===
  // No change here
  const xTranslateHeadshot = useTransform(x, [-600, 600], [-4, 4]);
  const yTranslateHeadshot = useTransform(y, [-400, 400], [-3, 3]);
  const xTranslateHelmet = useTransform(x, [-600, 600], [-2, 2]);
  const yTranslateHelmet = useTransform(y, [-400, 400], [-1, 1]);

  // No change to this function
  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);

    if (throttleTimer.current) return;
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
    }, 15);

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

  // === Scroll "Fly-Away" Logic ===
  // No change here
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // --- No change to the main return function ---
  return (
    <motion.main
      ref={scrollRef}
      className="relative h-screen w-full bg-white"
      onMouseMove={handleMouseMove}
      style={{
        scale,
        opacity,
        isolation: "isolate",
        overflow: "hidden",
      }}
    >
      {/* === 2. RENDER THE IMPORTED BACKGROUND === */}
      <AnimatedTopologyBackground />
      {/* ======================================= */}

      {/* === SVG MASK DEFINITION === */}
      <svg className="absolute left-0 top-0 h-0 w-0" aria-hidden="true">
        <defs>
          <mask id="particle-mask">
            <rect width="100%" height="100%" fill="black" />
            {/* +++ USE THE NEW SAFE COMPONENT +++ */}
            {dashPool.map((dash, i) => (
              <ParticleEllipse key={i} dash={dash} />
            ))}
            {/* ++++++++++++++++++++++++++++++++++++ */}
          </mask>
        </defs>
      </svg>

      {/* === LAYER 1 (z-10) - Headshot Face === */}
      {/* No change */}
      <motion.img
        src="/headshot_transparent.png"
        alt="Headshot Face"
        className="absolute inset-0 z-10 h-full w-full object-contain"
        style={{
          x: xTranslateHeadshot,
          y: yTranslateHeadshot,
        }}
      />

      {/* === LAYER 2 (z-20) - Base Outline === */}
      {/* No change */}
      <motion.img
        src="/helmet.png"
        alt="Helmet Outline"
        className="absolute inset-0 z-20 h-full w-full object-contain opacity-10"
        style={{
          x: xTranslateHelmet,
          y: yTranslateHelmet,
        }}
      />

      {/* === LAYER 2.5 (z-20) - The Glow Scan === */}
      {/* No change */}
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

      {/* === LAYER 3 (z-30) - Helmet Reveal === */}
      {/* No change */}
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
  );
}

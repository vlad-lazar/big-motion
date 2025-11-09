"use client";

import {
  useMotionValue,
  useTransform,
  motion,
  useScroll,
  useMotionTemplate, // We need this again
  useSpring,
} from "framer-motion";
import { useRef } from "react";
import React from "react";

// --- Helper Function: Creates one set of dash springs ---
const createDashSprings = () => {
  // Softer, bouncier spring
  const springConfig = { damping: 30, stiffness: 100, mass: 1 };

  return {
    x: useSpring(0, springConfig), // cx
    y: useSpring(0, springConfig), // cy
    width: useSpring(0, springConfig), // rx
    height: useSpring(0, springConfig), // ry
    rotate: useSpring(0, springConfig), // rotation
  };
};

// --- New, truly random shape function ---
function setRandomShape(dash) {
  // This function now creates a much wider variety of shapes.
  // Sometimes it will be a circle (width ≈ height).
  // Sometimes it will be a dash (width >> height).
  // And it will always have a random rotation.

  const widthRadius = 20 + Math.random() * 80; // Radius: 20px to 100px
  const heightRadius = 20 + Math.random() * 80; // Radius: 20px to 100px
  const rotation = Math.random() * 360; // 0 to 360 degrees

  dash.width.set(widthRadius);
  dash.height.set(heightRadius);
  dash.rotate.set(rotation);
}

export default function Home() {
  // === Particle Pool ===
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

  // === Particle State Refs ===
  const dashTimeouts = useRef<NodeJS.Timeout[][]>(
    Array(dashPool.length)
      .fill(null)
      .map(() => [])
  ).current;

  const particleIndex = useRef(0);
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);

  // === Parallax for Headshot ===
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xTransformHeadshot = useTransform(x, [-600, 600], [-10, 10]);
  const yTransformHeadshot = useTransform(y, [-400, 400], [-5, 5]);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);

    // --- Simple Throttle ---
    if (throttleTimer.current) {
      return;
    }
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
    }, 25);

    // --- "Fire" a Particle ---
    const index = (particleIndex.current + 1) % dashPool.length;
    particleIndex.current = index;
    const currentDash = dashPool[index];
    const currentTimers = dashTimeouts[index];

    // Clear any old timeouts
    currentTimers.forEach(clearTimeout);
    dashTimeouts[index] = [];

    // Set particle position (center of the ellipse)
    currentDash.x.set(event.clientX - rect.left);
    currentDash.y.set(event.clientY - rect.top);

    // --- (Phase 1) Spawn with first random shape ---
    setRandomShape(currentDash);

    const lifespan = 400; // Total particle life

    // --- (Phase 2) "Pulse" to a new random shape mid-life ---
    const pulseTimer = setTimeout(() => {
      setRandomShape(currentDash);
    }, lifespan / 2);

    // --- (Phase 3) Despawn at the end of its life ---
    const despawnTimer = setTimeout(() => {
      currentDash.width.set(0);
      currentDash.height.set(0);
      // No need to reset rotate, it's invisible
    }, lifespan);

    // Store the new timeouts
    dashTimeouts[index].push(pulseTimer, despawnTimer);
  }

  // === Scroll "Fly-Away" Logic ===
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // We need this for the SVG transform attribute
  const transformTemplate = useMotionTemplate;

  return (
    <div className="flex min-h-[300vh] flex-col items-center bg-black">
      <motion.main
        ref={scrollRef}
        className="relative h-screen w-full"
        onMouseMove={handleMouseMove}
        style={{
          scale,
          opacity,
          isolation: "isolate", // For Safari mask
        }}
      >
        {/* === SVG MASK DEFINITION (Using <ellipse>) === */}
        <svg
          className="absolute left-0 top-0 h-0 w-0" // Visually hidden
          aria-hidden="true"
        >
          <defs>
            <mask id="particle-mask">
              {/* Start with a black background = 100% transparent (hidden) */}
              <rect width="100%" height="100%" fill="black" />

              {/* Render our 8 motion-driven ellipses */}
              {dashPool.map((dash, i) => (
                <motion.ellipse
                  key={i}
                  fill="white" // 'white' = 100% opaque (REVEAL the image)
                  // Center the ellipse on the cursor
                  cx={dash.x}
                  cy={dash.y}
                  // Use our random animated radii
                  rx={dash.width}
                  ry={dash.height}
                  // Apply the random animated rotation around the ellipse's center
                  transform={transformTemplate`rotate(${dash.rotate} ${dash.x} ${dash.y})`}
                />
              ))}
            </mask>
          </defs>
        </svg>

        {/* === LAYER 1 (Bottom) === */}
        <motion.img
          src="/headshot_transparent.png"
          alt="Headshot"
          className="absolute inset-0 z-10 h-full w-full object-contain"
          style={{
            x: xTransformHeadshot,
            y: yTransformHeadshot,
          }}
        />

        {/* === LAYER 2 (Middle) === */}
        <motion.img
          src="/helmet.png"
          alt="Helmet Outline"
          className="absolute inset-0 z-20 h-full w-full object-contain opacity-10"
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* === LAYER 3 (Top) === */}
        <motion.img
          src="/helmet.png"
          alt="Helmet Reveal"
          className="absolute inset-0 z-30 h-full w-full object-contain"
          style={{
            // Use the SVG mask we defined above
            maskImage: "url(#particle-mask)",
            WebkitMaskImage: "url(#particle-mask)",
          }}
        />
      </motion.main>

      <div className="h-screen text-white">
        <p className="pt-24 text-center">More page content here</p>
      </div>
    </div>
  );
}

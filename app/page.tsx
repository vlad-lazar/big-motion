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

// --- Helper Function: Creates one set of dash springs ---
const createDashSprings = () => {
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  return {
    x: useSpring(0, springConfig),
    y: useSpring(0, springConfig),
    width: useSpring(0, springConfig),
    height: useSpring(0, springConfig),
    rotate: useSpring(0, springConfig), // We have this if we need it
  };
};

export default function Home() {
  // === Particle Pool ===
  // 1. Increased pool size from 5 to 8
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

  const particleIndex = useRef(0);
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);

  // === Bubbly REVEAL Mask (Dash Pool) ===
  // 2. Updated template to include all 8 dashes
  const maskImage = useMotionTemplate`
    radial-gradient(
      ellipse ${dashPool[0].width}px ${dashPool[0].height}px at ${dashPool[0].x}px ${dashPool[0].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[1].width}px ${dashPool[1].height}px at ${dashPool[1].x}px ${dashPool[1].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[2].width}px ${dashPool[2].height}px at ${dashPool[2].x}px ${dashPool[2].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[3].width}px ${dashPool[3].height}px at ${dashPool[3].x}px ${dashPool[3].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[4].width}px ${dashPool[4].height}px at ${dashPool[4].x}px ${dashPool[4].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[5].width}px ${dashPool[5].height}px at ${dashPool[5].x}px ${dashPool[5].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[6].width}px ${dashPool[6].height}px at ${dashPool[6].x}px ${dashPool[6].y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      ellipse ${dashPool[7].width}px ${dashPool[7].height}px at ${dashPool[7].x}px ${dashPool[7].y}px, 
      black 99%, 
      transparent 100%
    )
  `;

  // === Parallax for Headshot (Bottom Layer) ===
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xTransformHeadshot = useTransform(x, [-600, 600], [-10, 10]);
  const yTransformHeadshot = useTransform(y, [-400, 400], [-5, 5]);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);

    // --- Simple Throttle (Slightly faster) ---
    if (throttleTimer.current) {
      return;
    }

    // 3. Spawning particles slightly faster (25ms)
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
    }, 25);

    // --- "Fire" a Particle ---
    const index = (particleIndex.current + 1) % dashPool.length;
    particleIndex.current = index;
    const currentDash = dashPool[index];

    // 4. More "uneven" randomization
    currentDash.x.set(event.clientX - rect.left);
    currentDash.y.set(event.clientY - rect.top);
    // Width: can be short (30) or long (330)
    currentDash.width.set(30 + Math.random() * 300);
    // Height: can be very thin (10) or fatter (80)
    currentDash.height.set(10 + Math.random() * 70);

    // 5. Increased lifespan (400ms) for a larger reveal
    setTimeout(() => {
      currentDash.width.set(0);
      currentDash.height.set(0);
    }, 400);
  }

  // === Scroll "Fly-Away" Logic (unchanged) ===
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="flex min-h-[300vh] flex-col items-center bg-black">
      <motion.main
        ref={scrollRef}
        className="relative h-screen w-full"
        onMouseMove={handleMouseMove}
        style={{
          scale,
          opacity,
        }}
      >
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
            maskImage: maskImage,
            WebkitMaskImage: maskImage, // For Safari
          }}
        />
      </motion.main>

      <div className="h-screen text-white">
        <p className="pt-24 text-center">More page content here</p>
      </div>
    </div>
  );
}

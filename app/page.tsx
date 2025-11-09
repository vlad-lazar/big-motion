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

export default function Home() {
  // === Mouse Logic: Leaders ===
  const maskX = useMotionValue(0);
  const maskY = useMotionValue(0);

  // === Mouse Logic: Springs (The "Bubbles") ===
  const springConfig = { damping: 30, stiffness: 100, mass: 0.5 };
  const bubble1X = useSpring(maskX, springConfig);
  const bubble1Y = useSpring(maskY, springConfig);
  const bubble2X = useSpring(maskX, { damping: 50, stiffness: 200, mass: 1 });
  const bubble2Y = useSpring(maskY, { damping: 50, stiffness: 200, mass: 1 });
  const bubble3X = useSpring(maskX, { damping: 70, stiffness: 300, mass: 1.5 });
  const bubble3Y = useSpring(maskX, { damping: 70, stiffness: 300, mass: 1.5 });

  // === Bubbly REVEAL Mask (Hard Edge) ===
  // 1. This is the change!
  //    'black 99%, transparent 100%' creates a hard-edged circle.
  const maskImage = useMotionTemplate`
    radial-gradient(
      150px at ${bubble1X}px ${bubble1Y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      250px at ${bubble2X}px ${bubble2Y}px, 
      black 99%, 
      transparent 100%
    ),
    radial-gradient(
      100px at ${bubble3X}px ${bubble3Y}px, 
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
    maskX.set(event.clientX - rect.left);
    maskY.set(event.clientY - rect.top);
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

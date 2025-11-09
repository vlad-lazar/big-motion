"use client";

import React from "react";
import { motion, useTime, useTransform } from "framer-motion";

export const AnimatedTopologyBackground = () => {
  const time = useTime();

  // 1. Panning/drifting animation (slow, for a gentle drift)
  const timeLoopX = useTransform(time, (v) => v % 80000); // 80-second loop
  const dx = useTransform(timeLoopX, [0, 80000], [-100, 100]);

  const timeLoopY = useTransform(time, (v) => v % 60000); // 60-second loop
  const dy = useTransform(timeLoopY, [0, 60000], [-100, 100]);

  // 2. "Breathing" (zooming) animation
  const timeLoopZoom = useTransform(time, (v) => v % 30000); // 30-second loop
  const frequency = useTransform(
    timeLoopZoom,
    [0, 15000, 30000],
    [0.015, 0.03, 0.015] // "Breathe" in and out
  );

  return (
    <svg
      // --- STARTING VISIBLE ---
      // Let's start with 30% opacity to be SURE we see it.
      // We can tune this down later.
      className="absolute left-0 top-0 h-full w-full opacity-30"
      style={{ zIndex: 0 }}
    >
      <defs>
        <filter
          id="topology-lines"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          {/* STEP 1: Create the base noise "height map" */}
          <motion.feTurbulence
            type="turbulence"
            baseFrequency={frequency}
            numOctaves="2"
            seed="10"
            result="noise"
          />

          {/* STEP 2: Pan the noise to make it "drift" */}
          <motion.feOffset in="noise" dx={dx} dy={dy} result="panned_noise" />

          {/* STEP 3: Convert the noise to grayscale */}
          <feColorMatrix
            in="panned_noise"
            type="saturate"
            values="0"
            result="grayscale_noise"
          />

          {/* STEP 4: Posterize the grayscale noise.
              This is the KEY. We "slice" the smooth grayscale
              into 4 hard-edged bands (like a contour map).
          */}
          <feColorMatrix
            in="grayscale_noise"
            type="discrete" // "Discrete" = posterize
            tableValues="0 0.33 0.66 1" // 4 levels
            result="banded_noise"
          />

          {/* STEP 5: Find the *edges* between the bands.
              This filter finds the outline of a shape.
          */}
          <feMorphology
            in="banded_noise"
            operator="dilate" // "Thicken" the bands slightly
            radius="0.5" // A small radius = thin lines
            result="dilated"
          />
          <feComposite
            in="dilated"
            in2="banded_noise"
            operator="out" // Subtract the original bands
            result="edges" // Leaves *only* the outlines
          />

          {/* STEP 6: Color the outlines black.
              We use the "edges" as a mask for our SourceGraphic.
          */}
          <feComposite
            in="SourceGraphic"
            in2="edges"
            operator="in"
            result="final_lines"
          />
        </filter>
      </defs>

      {/* This is the "SourceGraphic" - a black rectangle.
          The filter will be applied to this, and only the
          "edges" will be kept.
      */}
      <rect
        width="100%"
        height="100%"
        fill="black"
        filter="url(#topology-lines)"
      />
    </svg>
  );
};

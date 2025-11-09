"use client";

import React from "react";
import HeroFrame from "./HeroFrame"; // Import our new component

export default function Home() {
  return (
    // 1. Set the whole page background to a dark olive green
    <div className="flex min-h-[300vh] flex-col items-center bg-lime-900">
      {/* 2. Render the self-contained hero animation */}
      <HeroFrame />

      {/* 3. This is the "remainder" of the page */}
      {/* We make the text light to be visible on the dark olive bg */}
      <div className="h-screen text-lime-100">
        <p className="pt-24 text-center">More page content here</p>
      </div>
    </div>
  );
}

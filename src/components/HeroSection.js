// src/components/HeroSection.js
import React from 'react';

const HeroSection = () => (
  <div className="relative bg-cover bg-center min-h-screen" style={{ backgroundImage: "url('/homepage_background.webp')" }}>
    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
    <div className="relative z-10 text-center text-white flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold">Experience Innovation</h1>
      <p className="text-xl mt-4">Interactive projects that redefine possibilities.</p>
      <button className="mt-8 px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-300 transition">
        Explore Projects
      </button>
    </div>
  </div>
);

export default HeroSection;

import React from 'react';

const HeroSection = () => {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div
      className="relative bg-cover bg-center min-h-screen"
      style={{ backgroundImage: "url('/homepage_background.webp')" }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center text-white px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">Mohamed AlKamali</h1>
        <p className="text-lg sm:text-xl md:text-2xl mt-4 text-gray-300 font-light">
          Researcher &nbsp;·&nbsp; ML Engineer &nbsp;·&nbsp; Abu Dhabi, UAE
        </p>
        <p className="text-base sm:text-lg mt-6 max-w-2xl text-gray-200 leading-relaxed">
          Innovative researcher bridging physics and AI — from optical sensor modelling
          to large-scale machine learning and real-time computer vision systems.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => scrollTo('about')}
            className="px-8 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
          >
            About Me
          </button>
          <button
            onClick={() => scrollTo('interactive-demos')}
            className="px-8 py-3 border-2 border-white text-white font-semibold rounded hover:bg-white hover:text-black transition"
          >
            Interactive Demos
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

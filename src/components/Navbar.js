import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolling(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition ${
        scrolling ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
      style={{
        top: 0,
        left: 0,
        height: '60px', // Adjust as needed
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold text-gray-800">
          My Portfolio
        </a>
        <div className="space-x-6">
          <a href="/" className="text-gray-800 hover:text-gray-600">
            Home
          </a>
          <a href="#projects" className="text-gray-800 hover:text-gray-600">
            Projects
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

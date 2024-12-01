import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
        height: '60px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          My Portfolio
        </Link>
        <div className="space-x-6">
          <Link to="/" className="text-gray-800 hover:text-gray-600">
            Home
          </Link>
          <Link to="/#projects" className="text-gray-800 hover:text-gray-600">
            Projects
          </Link>
          <Link to="/projects/doublependulum" className="text-gray-800 hover:text-gray-600">
            Double Pendulum
          </Link>
          <Link to="/projects/nnapproximation" className="text-gray-800 hover:text-gray-600">
            Neural Network Approximation
          </Link>
          <Link to="/projects/3dcube" className="text-gray-800 hover:text-gray-600">
            3D Cube Animation
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

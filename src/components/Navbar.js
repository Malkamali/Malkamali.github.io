import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Education', href: '/#education' },
  { label: 'Interactive Demos', href: '/#interactive-demos' },
];

const Navbar = () => {
  const [scrolling, setScrolling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolling(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const solidBg = scrolling || menuOpen;
  const linkClass = solidBg
    ? 'text-gray-800 hover:text-gray-600'
    : 'text-white hover:text-gray-300';

  return (
    <nav
      className={`fixed w-full z-50 transition-colors duration-300 ${
        solidBg ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
      style={{ top: 0, left: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-[60px]">
        <Link to="/" className={`text-xl font-bold transition-colors ${linkClass}`}>
          Home
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-6 items-center">
          {navLinks.map(({ label, href }) => (
            <a key={label} href={href} className={`text-sm font-medium transition-colors ${linkClass}`}>
              {label}
            </a>
          ))}
        </div>

        {/* Hamburger (mobile only) */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 transition-colors ${solidBg ? 'bg-gray-800' : 'bg-white'}`} />
          <span className={`block w-6 h-0.5 transition-colors ${solidBg ? 'bg-gray-800' : 'bg-white'}`} />
          <span className={`block w-6 h-0.5 transition-colors ${solidBg ? 'bg-gray-800' : 'bg-white'}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-4">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-gray-800 hover:text-gray-600 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

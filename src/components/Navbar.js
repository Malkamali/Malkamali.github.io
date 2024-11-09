import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white px-4 py-2 fixed w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a href="/" className="text-xl font-bold">My Portfolio</a>
        <div className="space-x-4">
          <a href="/" className="hover:text-gray-400">Home</a>
          <a href="#projects" className="hover:text-gray-400">Projects</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
import React from 'react';

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-5xl mx-auto px-4 text-center">
      <h3 className="text-2xl font-bold mb-1">Mohamed AlKamali</h3>
      <p className="text-gray-400 mb-6 text-sm">Researcher · ML Engineer · Abu Dhabi, UAE</p>
      <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
        <a
          href="mailto:mohamed.alkamali@outlook.com"
          className="text-gray-300 hover:text-white transition"
        >
          mohamed.alkamali@outlook.com
        </a>
        <span className="text-gray-600 hidden sm:inline">·</span>
        <a
          href="https://github.com/Malkamali"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white transition"
        >
          GitHub
        </a>
      </div>
      <p className="text-gray-600 text-xs">
        © {new Date().getFullYear()} Mohamed AlKamali. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default Footer;

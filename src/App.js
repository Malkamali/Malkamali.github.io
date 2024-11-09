import React from 'react';
import Navbar from './components/Navbar';
import Projects from './components/Projects';

function App() {
  return (
    <div>
      <Navbar />
      <header className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold">Welcome to My Portfolio</h1>
          <p className="text-xl mt-4">Explore my interactive projects and work.</p>
        </div>
      </header>
      <Projects />
    </div>
  );
}

export default App;

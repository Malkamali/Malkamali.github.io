// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Projects from './components/Projects';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <HeroSection />
              <div id="double-pendulum">
                <Projects />
              </div>
              <div id="neural-network-approximation">
                <Projects />
              </div>
            </>
          } 
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Projects from './components/Projects';
import DoublePendulum from './components/DoublePendulum'; // Project Component
import NNapproximation from './components/NNapproximation'; // Added NN Approximation
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
              <Projects />
            </>
          } 
        />
        <Route path="/projects/doublependulum" element={<DoublePendulum />} />
        <Route path="/projects/nnapproximation" element={<NNapproximation />} /> {/* New Route */}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;

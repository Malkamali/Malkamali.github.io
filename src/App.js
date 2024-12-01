// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Projects from './components/Projects';
import Footer from './components/Footer';
import DoublePendulum from './components/DoublePendulum';
import NNapproximation from './components/NNapproximation';

// Scroll to the section based on the route or hash
function ScrollToSection() {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.pathname.split('/').pop(); // Get the last part of the URL
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToSection />
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
        {/* Specific project routes */}
        <Route path="/projects/doublependulum" element={<DoublePendulum />} />
        <Route path="/projects/nnapproximation" element={<NNapproximation />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;

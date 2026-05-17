import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ExperienceSection from './components/ExperienceSection';
import EducationSection from './components/EducationSection';
import Projects from './components/Projects';
import Footer from './components/Footer';
import DoublePendulum from './components/DoublePendulum';
import NNapproximation from './components/NNapproximation';
import CubeAnimation from './components/CubeAnimation';

function ScrollToSection() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const sectionId = location.pathname.split('/').pop();
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
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
              <AboutSection />
              <ExperienceSection />
              <EducationSection />
              <Projects />
            </>
          }
        />
        <Route path="/projects/doublependulum" element={<DoublePendulum />} />
        <Route path="/projects/nnapproximation" element={<NNapproximation />} />
        <Route path="/projects/3dcube" element={<CubeAnimation />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;

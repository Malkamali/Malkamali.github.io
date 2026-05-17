import React from 'react';

const expertise = [
  'Research & Development',
  'Large-Scale Machine Learning',
  'Computer Vision',
  'Optical Sensor Modelling',
  'High-Power Directed Energy',
  'Numerical Simulations',
  'Data Analysis & Visualisation',
  'Public Speaking',
];

const skills = [
  'Python', 'C++', 'SQL', 'TensorFlow', 'PyTorch',
  'Machine Learning', 'Deep Learning', 'Git', 'Linux', 'MATLAB',
];

const AboutSection = () => (
  <section id="about" className="bg-white py-20">
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-10">About Me</h2>

      <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto mb-14">
        I hold Master's degrees in Computer Science &amp; Engineering (Penn State, GPA 3.90)
        and Physics (Belarusian State University, GPA 3.77), alongside a B.Sc. in Mechanical
        Engineering. Currently a researcher at the Technology Innovation Institute in Abu Dhabi,
        I develop AI-driven models and real-time controllers for physical systems — combining
        deep learning with numerical methods and sensor technology.
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas of Expertise</h3>
          <div className="flex flex-wrap gap-2">
            {expertise.map((item) => (
              <span
                key={item}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-5 text-gray-500 text-sm">
            <span className="font-medium text-gray-700">Languages:</span> English, Arabic
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;

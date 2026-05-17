import React from 'react';
import { Link } from 'react-router-dom';

const demos = [
  {
    name: 'Double Pendulum',
    tag: 'Physics · Simulation',
    description:
      'An interactive simulation of a double pendulum — a classic chaotic system. Adjust rod lengths, masses, and initial angles to explore sensitivity to initial conditions.',
    path: '/projects/doublependulum',
  },
  {
    name: 'Neural Network Approximation',
    tag: 'ML · Live Training',
    description:
      'Watch a neural network learn to approximate any polynomial in real time. Configure the architecture, choose an activation function, then observe training unfold epoch by epoch.',
    path: '/projects/nnapproximation',
  },
  {
    name: '3D Cube Animation',
    tag: 'Graphics · CSS 3D',
    description:
      'A 3D spinning cube built entirely with CSS perspective transforms — six distinctly coloured faces in continuous rotation.',
    path: '/projects/3dcube',
  },
];

const Projects = () => (
  <section id="interactive-demos" className="bg-gray-50 py-20">
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-3">Interactive Demos</h2>
      <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
        A collection of interactive visualisations built for fun and exploration — not professional work.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {demos.map((demo) => (
          <div
            key={demo.name}
            className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition flex flex-col"
          >
            <span className="text-xs text-blue-500 font-semibold tracking-wide uppercase mb-2">
              {demo.tag}
            </span>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{demo.name}</h3>
            <p className="text-gray-600 text-sm leading-relaxed flex-1">{demo.description}</p>
            <Link
              to={demo.path}
              className="text-blue-500 hover:text-blue-700 font-medium mt-5 text-sm inline-block"
            >
              Launch →
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Projects;

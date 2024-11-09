import React from 'react';
import { Link } from 'react-router-dom';

const Projects = () => {
  const projects = [
    { 
      name: "Double Pendulum", 
      description: "An interactive simulation of a chaotic system.", 
      path: "/projects/doublependulum" 
    },
    { 
      name: "Neural Network Approximation", 
      description: "Visualize how a neural network approximates a polynomial function live.", 
      path: "/projects/nnapproximation" 
    },
    { 
      name: "3D Cube Animation", 
      description: "A 3D spinning cube showcasing animations.", 
      path: "/projects/3dcube" 
    }
  ];

  return (
    <section id="projects" className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-8">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="border p-6 rounded-lg shadow-md bg-white hover:shadow-lg transition">
              <h3 className="text-2xl font-semibold">{project.name}</h3>
              <p className="mt-2">{project.description}</p>
              <Link 
                to={project.path} 
                className="text-blue-500 hover:underline mt-4 block"
              >
                View Project
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;

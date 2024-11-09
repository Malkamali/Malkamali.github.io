import React from 'react';

const Projects = () => {
  const projects = [
    { name: "Double Pendulum", description: "An interactive simulation of a chaotic system." },
    { name: "Other Project", description: "Description of another cool project." },
  ];

  return (
    <section id="projects" className="bg-white text-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-8">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="border p-4 rounded shadow-lg">
              <h3 className="text-2xl font-semibold">{project.name}</h3>
              <p className="mt-2">{project.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;

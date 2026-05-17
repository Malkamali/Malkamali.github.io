import React from 'react';

const experiences = [
  {
    role: 'Researcher',
    org: 'Technology Innovation Institute',
    location: 'Abu Dhabi, UAE',
    period: 'Feb 2020 – Present',
    bullets: [
      'Implemented and optimised AI models for practical physical applications and simulations.',
      'Developed real-time controllers by combining computer vision algorithms and AI to improve dynamic response in physical systems.',
      'Built models for optical sensors to measure physical properties; led R&D in sensor technology during postgraduate studies.',
    ],
  },
  {
    role: 'Al Nokhba Program',
    org: 'Khalifa University',
    location: 'Abu Dhabi, UAE',
    period: 'Aug 2024 – 2025',
    bullets: [
      'Implemented ML techniques to enhance nuclear monitoring networks across the UAE region.',
      'Processed large geophysical datasets to reconstruct hypothetical nuclear release scenarios at both global and local scales around the Barakah power plants.',
    ],
  },
  {
    role: 'Intern',
    org: 'Human Resources Authority',
    location: 'Abu Dhabi, UAE',
    period: 'Nov 2019 – Jan 2020',
    bullets: [
      'Developed large-scale databases to improve data management practices.',
      'Applied data-cleansing techniques to streamline ETL pipelines.',
      'Created interactive BI dashboards for actionable business insights.',
    ],
  },
];

const ExperienceSection = () => (
  <section id="experience" className="bg-gray-50 py-20">
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12">Experience</h2>
      <div className="space-y-6">
        {experiences.map((exp) => (
          <div
            key={exp.org + exp.period}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500"
          >
            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{exp.role}</h3>
                <p className="text-blue-600 font-medium text-sm mt-0.5">
                  {exp.org} &nbsp;·&nbsp; {exp.location}
                </p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap self-start">
                {exp.period}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {exp.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ExperienceSection;

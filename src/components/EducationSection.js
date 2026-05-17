import React from 'react';

const education = [
  {
    degree: "Master's in Physics",
    school: 'Belarusian State University',
    location: 'Belarus',
    year: 'Dec 2022',
    gpa: '3.77 / 4.00',
    detail: 'Photonics, high-power LASERs, optical gratings. Research: numerical modelling of fiber Bragg gratings for dual-sensing of temperature and stress.',
  },
  {
    degree: "Master's in Computer Science & Engineering",
    school: 'Pennsylvania State University',
    location: 'USA',
    year: 'Aug 2020',
    gpa: '3.90 / 4.00',
    detail: 'Pattern recognition, machine learning, computer vision, and digital image processing. Research: statistical and runtime trade-offs between training time and sample size.',
  },
  {
    degree: 'B.Sc. in Mechanical Engineering',
    school: 'Pennsylvania State University',
    location: 'USA',
    year: 'Dec 2018',
    gpa: '3.82 / 4.00',
    detail: 'Minor: Economics. Capstone: designed and built a miniature wind turbine capable of powering a household device from average wind speeds.',
  },
];

const EducationSection = () => (
  <section id="education" className="bg-white py-20">
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12">Education</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {education.map((ed) => (
          <div
            key={ed.degree}
            className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition flex flex-col"
          >
            <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase mb-2">
              {ed.year}
            </span>
            <h3 className="text-base font-semibold text-gray-800 leading-snug mb-1">
              {ed.degree}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              {ed.school} &nbsp;·&nbsp; {ed.location}
            </p>
            <p className="text-sm font-medium text-gray-700 mb-3">GPA: {ed.gpa}</p>
            <p className="text-xs text-gray-500 leading-relaxed flex-1">{ed.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default EducationSection;

'use client';
import React from 'react';
import { ResumeData } from '@/types/types';

interface MinimalTemplateProps {
  data: ResumeData;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data }) => {
  const { profile, skills, experience, education, certificates } = data;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-light">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-5xl font-thin text-gray-900 mb-4">{profile.fullname}</h1>
        <div className="flex flex-wrap gap-8 text-gray-600 text-sm">
          <span>{profile.email}</span>
          <span>{profile.phone}</span>
          <span>{profile.location}</span>
        </div>
        {profile.links && profile.links.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-2 text-sm">
            {profile.links.map((link, index) => (
              <a key={index} href={link.url} className="text-gray-600 hover:text-gray-900 transition-colors">
                {link.type}
              </a>
            ))}
          </div>
        )}
        {profile.summary && (
          <div className="mt-8">
            <p className="text-gray-700 leading-relaxed max-w-3xl">{profile.summary}</p>
          </div>
        )}
      </div>

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-normal text-gray-900 mb-6 tracking-wide">EXPERIENCE</h2>
          <div className="space-y-8">
            {experience.map((exp, index) => (
              <div key={index}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{exp.title}</h3>
                    <p className="text-gray-700">{exp.company}</p>
                  </div>
                  <div className="text-gray-600 text-sm mt-1 md:mt-0">
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{exp.location}</p>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <ul className="space-y-2 text-gray-700">
                    {exp.responsibilities.map((resp, respIndex) => (
                      <li key={respIndex} className="flex items-start">
                        <span className="text-gray-400 mr-3 mt-2">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-normal text-gray-900 mb-6 tracking-wide">EDUCATION</h2>
          <div className="space-y-6">
            {education.map((edu, index) => (
              <div key={index}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-700">{edu.university}</p>
                    <p className="text-gray-600 text-sm">{edu.location}</p>
                  </div>
                  <div className="text-gray-600 text-sm mt-1 md:mt-0">
                    {edu.startDate} — {edu.current ? 'Present' : edu.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-normal text-gray-900 mb-6 tracking-wide">SKILLS</h2>
          <div className="space-y-4">
            {skills.map((skillGroup, index) => (
              <div key={index}>
                {skillGroup.type && (
                  <h3 className="font-medium text-gray-800 mb-2">{skillGroup.type}</h3>
                )}
                {skillGroup.skills && (
                  <p className="text-gray-700">{skillGroup.skills.join(' • ')}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-normal text-gray-900 mb-6 tracking-wide">CERTIFICATIONS</h2>
          <div className="space-y-4">
            {certificates.map((cert, index) => (
              <div key={index}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                  <div>
                    <h3 className="font-medium text-gray-900">{cert.title}</h3>
                    <p className="text-gray-700">{cert.issued_by}</p>
                  </div>
                  <div className="text-gray-600 text-sm mt-1 md:mt-0">
                    {cert.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;
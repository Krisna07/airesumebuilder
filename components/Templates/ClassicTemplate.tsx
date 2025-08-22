'use client';
import React from 'react';
import { ResumeData } from '@/types/types';

interface ClassicTemplateProps {
  data: ResumeData;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data }) => {
  const { profile, skills, experience, education, certificates } = data;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header Section */}
      <div className="border-b-4 border-gray-800 p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{profile.fullname}</h1>
        <div className="flex flex-wrap justify-center gap-6 text-gray-600">
          <span>{profile.email}</span>
          <span>{profile.phone}</span>
          <span>{profile.location}</span>
        </div>
        {profile.links && profile.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            {profile.links.map((link, index) => (
              <a key={index} href={link.url} className="text-gray-600 hover:text-gray-800 transition-colors">
                {link.type}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Summary */}
        {profile.summary && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{exp.title}</h3>
                      <p className="text-lg text-gray-700 font-medium">{exp.company}</p>
                      <p className="text-gray-600">{exp.location}</p>
                    </div>
                    <div className="text-gray-600 font-medium mt-1 md:mt-0">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </div>
                  </div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      {exp.responsibilities.map((resp, respIndex) => (
                        <li key={respIndex}>{resp}</li>
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
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{edu.degree}</h3>
                    <p className="text-gray-700 font-medium">{edu.university}</p>
                    <p className="text-gray-600">{edu.location}</p>
                  </div>
                  <div className="text-gray-600 font-medium mt-1 md:mt-0">
                    {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
              Skills
            </h2>
            <div className="space-y-4">
              {skills.map((skillGroup, index) => (
                <div key={index}>
                  {skillGroup.type && (
                    <h3 className="font-bold text-gray-700 mb-2">{skillGroup.type}:</h3>
                  )}
                  {skillGroup.skills && (
                    <p className="text-gray-700">{skillGroup.skills.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {certificates && certificates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide border-b border-gray-300 pb-2">
              Certifications
            </h2>
            <div className="space-y-3">
              {certificates.map((cert, index) => (
                <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{cert.title}</h3>
                    <p className="text-gray-700">{cert.issued_by}</p>
                  </div>
                  <div className="text-gray-600 font-medium mt-1 md:mt-0">
                    {cert.year}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ClassicTemplate;
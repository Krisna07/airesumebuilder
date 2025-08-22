'use client';
import React from 'react';
import { ResumeData } from '@/types/types';

interface ModernTemplateProps {
  data: ResumeData;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ data }) => {
  const { profile, skills, experience, education, certificates } = data;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{profile.fullname}</h1>
            <div className="flex flex-wrap gap-4 text-blue-100">
              <span>{profile.email}</span>
              <span>{profile.phone}</span>
              <span>{profile.location}</span>
            </div>
            {profile.links && profile.links.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-2">
                {profile.links.map((link, index) => (
                  <a key={index} href={link.url} className="text-blue-100 hover:text-white transition-colors">
                    {link.type}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        {profile.summary && (
          <div className="mt-6">
            <p className="text-blue-50 leading-relaxed">{profile.summary}</p>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Experience */}
            {experience && experience.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
                  Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                      <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-2 top-0"></div>
                      <div className="mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{exp.title}</h3>
                        <p className="text-blue-600 font-medium">{exp.company}</p>
                        <p className="text-gray-600 text-sm">
                          {exp.location} • {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </p>
                      </div>
                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
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
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
                  Education
                </h2>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800">{edu.degree}</h3>
                      <p className="text-blue-600 font-medium">{edu.university}</p>
                      <p className="text-gray-600 text-sm">
                        {edu.location} • {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Skills */}
            {skills && skills.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
                  Skills
                </h2>
                <div className="space-y-4">
                  {skills.map((skillGroup, index) => (
                    <div key={index}>
                      {skillGroup.type && (
                        <h3 className="font-semibold text-gray-700 mb-2">{skillGroup.type}</h3>
                      )}
                      {skillGroup.skills && (
                        <div className="flex flex-wrap gap-2">
                          {skillGroup.skills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certificates */}
            {certificates && certificates.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
                  Certifications
                </h2>
                <div className="space-y-3">
                  {certificates.map((cert, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <h3 className="font-semibold text-gray-800">{cert.title}</h3>
                      <p className="text-blue-600 text-sm">{cert.issued_by}</p>
                      <p className="text-gray-600 text-sm">{cert.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
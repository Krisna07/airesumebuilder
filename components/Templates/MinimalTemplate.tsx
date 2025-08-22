'use client';
import React from 'react';
import { ResumeData } from '@/types/types';

interface MinimalTemplateProps {
  data: ResumeData;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data }) => {
  const { profile, skills, experience, education, certificates } = data;
  console.log(data);

  return (
    <div className='max-w-4xl mx-auto bg-white p-8 font-light grid gap-6 '>
      {/* Header Section */}
      <div className=' grid gap-2'>
        <h1 className='text-5xl  text-gray-900 font-semibold'>{profile.fullname}</h1>
        <div className=' flex flex-wrap text-gray-600 text-sm justify-between'>
          <span>{profile.email}</span>
          <span>{profile.phone}</span>
          <span>{profile.location}</span>
          {profile.links && profile.links.length > 0 && (
            <>
              {profile.links.map((link, index) => (
                <a key={index} href={link.url} className=' text-gray-600 hover:text-gray-900 transition-colors'>
                  {link.type}
                </a>
              ))}
            </>
          )}
        </div>
        <hr />

        {profile.summary && <p className='text-gray-700 leading-relaxed max-w-3xl'>{profile.summary}</p>}
      </div>

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className='grid gap-2'>
          <h2 className='text-lg  text-gray-900  tracking-wide font-bold'>EXPERIENCE</h2>
          <div className='grid gap-2'>
            {experience.map((exp, index) => (
              <div key={index}>
                <div className='flex flex-col md:flex-row md:justify-between md:items-baseline mb-3'>
                  <div>
                    <h3 className='text-lg font-medium text-gray-900'>{exp.title}</h3>
                    <p className='text-gray-700'>
                      {exp.company}, {exp.location}
                    </p>
                  </div>
                  <div className='text-gray-600 text-sm mt-1 md:mt-0'>
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>

                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <ul className='space-y-1 text-gray-700'>
                    {exp.responsibilities.map((resp, respIndex) => (
                      <li key={respIndex} className='flex items-start'>
                        <span className='text-gray-400 mr-3 mt-2'>•</span>
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
        <section className=''>
          <h2 className='text-lg  text-gray-900 tracking-wide font-bold'>EDUCATION</h2>
          <div className='space-y-2'>
            {education.map((edu, index) => (
              <div key={index}>
                <div className='flex flex-col md:flex-row md:justify-between md:items-baseline'>
                  <div>
                    <h3 className='text-lg font-medium text-gray-900'>{edu.degree}</h3>
                    <p className='text-gray-700'>
                      {edu.university}, {edu.location}
                    </p>
                  </div>
                  <div className='text-gray-600 text-sm mt-1 md:mt-0'>
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
        <section className=''>
          <h2 className='text-lg  text-gray-900 tracking-wide font-bold'>SKILLS</h2>
          <div className='space-y-2 '>
            {skills.map((skillGroup, index) => (
              <div key={index}>
                {skillGroup.type && <h3 className='font-medium text-gray-800 '>{skillGroup.type}</h3>}
                {skillGroup.skills && <p className='text-gray-700'>{skillGroup.skills.join(' | ')}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <section className=''>
          <h2 className='text-lg  text-gray-900  tracking-wide'>CERTIFICATIONS</h2>
          <div className='space-y-4'>
            {certificates.map((cert, index) => (
              <div key={index}>
                <div className='flex flex-col md:flex-row md:justify-between md:items-baseline'>
                  <div>
                    <h3 className='font-medium text-gray-900'>{cert.title}</h3>
                    <p className='text-gray-700'>{cert.issued_by}</p>
                  </div>
                  <div className='text-gray-600 text-sm mt-1 md:mt-0'>{cert.year}</div>
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
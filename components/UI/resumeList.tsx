'use client';
import React, { useState, useEffect } from 'react';
import { ResumeStorage, StoredResume } from '@/lib/resume-storage';
import Button from './Button';
import { ArrowUp, Eye,  FileEdit, Trash } from 'lucide-react';
import { createResume } from '@/services/resumeServices';

const ResumeList: React.FC = () => {
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = () => {
    try {
      const allResumes = ResumeStorage.listAll();
      setResumes(allResumes);
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (resumeId: string) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      ResumeStorage.delete(resumeId);
      loadResumes();
    }
  };

  const handleEdit = (resumeId: string) => {
    window.location.href = `/builder/${resumeId}`;
  };

  const handlePreview = (resumeId: string) => {
    window.location.href = `/builder/${resumeId}/preview`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">No resumes found</p>
        <Button variant="primary" size="medium" onClick={createResume}>
          Create New Resume
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:max-w-[1000px] space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl  text-gray-800 ">My Resumes <span className='text-sm font-bold underline'>{resumes.length} total</span></h2>
        <Button variant="primary" size="small" onClick={createResume}>
          Create New
        </Button>
      </div>
      
      <div className="w-full md:flex grid flex-wrap  gap-4">
        {resumes.map((resume) => (
          <div
            key={resume.resumeId}
            className="bg-white p-4 md:w-[300px] w-full flex items-center justify-between gap-4 rounded-lg border border-gray-200 hover:shadow-md transition-all ease-in-out"
          >
            <div className=" grid gap-2 justify-between items-start ">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {resume.resumeData.profile?.fullname || 'Untitled Resume'} 
                </h3>
                <p className="text-sm text-gray-600">
                  Template: {resume.template.charAt(0).toUpperCase() + resume.template.slice(1)}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(resume.createdOn).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
             
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => handlePreview(resume.resumeId)}
                  className='group relative grid place-items-center'

                >
                  <Eye className="w-4 h-4" />
                  <span className=' opacity-0  transition-all ease-in-out text-black duration-500 group-hover:w-fit absolute top-[100%]  w-0  group-hover:opacity-100'>Preview</span>
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleEdit(resume.resumeId)}
                  className='group relative grid place-items-center'
                >
                  <FileEdit className="w-4 h-4" />
                  <span className=' opacity-0  overflow-hidden transition-all ease-in-out text-black duration-500 group-hover:w-fit absolute top-[100%]  w-0  group-hover:opacity-100'>Edit</span>
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDelete(resume.resumeId)}
                  className='group relative grid place-items-center'

                >
                  <Trash className="w-4 h-4" />
                  <span className=' opacity-0  overflow-hidden transition-all ease-in-out text-black duration-500 group-hover:w-fit absolute top-[100%] w-0  group-hover:opacity-100'>Delete</span>
                </Button>
              </div>
            </div>
            <div className='w-20 h-20 bg-gradient-to-br p-1 from-10% from-red-100 to-80% to-gray-700 rounded-full'>
                <div className='w-full h-full  bg-white rounded-full flex place-items-center text-2xl text-green-700 font-medium'> <ArrowUp /> 70%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeList;

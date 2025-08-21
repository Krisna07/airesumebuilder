'use client';
import React, { useState, useEffect } from 'react';
import { ResumeStorage, StoredResume } from '@/lib/resume-storage';
import Button from './Button';
import { FaEye, FaTrash } from 'react-icons/fa6';
import { FaEdit } from 'react-icons/fa';

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
        <Button variant="primary" size="medium" onClick={() => window.location.href = '/builder'}>
          Create New Resume
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Your Resumes</h2>
        <Button variant="primary" size="small" onClick={() => window.location.href = '/builder'}>
          Create New
        </Button>
      </div>
      
      <div className="grid gap-4">
        {resumes.map((resume) => (
          <div
            key={resume.resumeId}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
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
                  variant="secondary"
                  size="small"
                  onClick={() => handlePreview(resume.resumeId)}
                >
                  <FaEye className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleEdit(resume.resumeId)}
                >
                  <FaEdit className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleDelete(resume.resumeId)}
                >
                  <FaTrash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeList;

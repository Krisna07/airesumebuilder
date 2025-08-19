'use client'
import MultiStepForm from '@/components/Forms/MultiStepForm'
import  {getResumeData}  from '@/services/resumeServices'
import { ResumeData } from '@/types/types'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Page = () => {
    const params = useParams();
    const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';
   const [resumeContent, setResumeContent] = useState<ResumeData>({
       profile:{fullname: '',
  email: '',
  phone: '',
  location: '',
  links: [{ type: '', url: ''}],
  summary: ''},
        skills: [],
        experience: [],
        education: [],
        certificates: []
   });

useEffect(() => {
  if (typeof window !== 'undefined' && slug) {
    const data = getResumeData(slug);
    setResumeContent(data);
  }
}, [slug]);
    // console.log(resumeData);

    return (
        <div className='w-full md:h-[80vh] grid place-items-center'>
            <MultiStepForm resumeContent={resumeContent && resumeContent} />
        </div>
    );
}

export default Page;

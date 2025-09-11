import React from 'react'
import dummyResume from '@/app/data/dummyResume.json';
import ResumePreview from '../Templates/ResumePreview';
import Button from '../UI/Button';
import { Link } from 'lucide-react';

const TemplateSlider = () => {
    const getDummyData = () => {
  return JSON.parse(JSON.stringify(dummyResume))
};
const dummyData = getDummyData()
const templates = [
    {name:'default'},
    {name:"modern"}, 
    {name:"classic"}, 
    {name:"minimal"},
    {name:"template01"},
    {name:"template02"}
]

  return (

     <div className='w-full grid gap-4 my-4 place-items-center  text-center'>
        <h2 className='w-full min-[500px]:w-[500px] text-2xl font-semibold'>Select From Design and Start Building your Resume</h2>
          <div className='w-full min-[1050px]:w-[1000px] md:grid flex md:grid-cols-3 p-2 gap-2 bg-gray-200 md:overflow-hidden overflow-x-scroll rounded-xl'>
                {templates.map((template)=> 
                    <div key={template.name} className='min-w-[300px] md:min-w-full py-4 h-[400px] bg-white rounded-xl hover:scale-[0.98] overflow-hidden group relative'>
                        <div className='group-hover:blur-[2px]'>   <ResumePreview template={template.name} resumeData={dummyData} /></div>
                      <Link href="/builder"> 
                       <button  className='absolute opacity-0 group-hover:opacity-100 top-[48%] group-hover:top-[50%] left-[25%] transition-all '>
                            Start Building
                        </button> 
                        </Link>  
                    </div>
                )}
        </div>
      </div>
  
  )
}

export default TemplateSlider
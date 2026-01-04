import React from 'react'

const LoadingResumeState = () => {
  return (
       <section className='w-full min-h-[70vh] flex flex-col items-center justify-center gap-8 px-4'>
        <div className='flex flex-col items-center gap-3'>
          <div className='relative'>
            <div className='absolute inset-0 animate-ping rounded-xl bg-sky-200/30' />
          </div>
          <h2 className='text-xl font-semibold text-gray-800 tracking-tight'>
            Loading your resumes
          </h2>
          <p className='text-gray-500 text-sm'>Please wait...</p>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full max-w-5xl'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='relative h-[300px] max-w-[250px] w-full overflow-hidden rounded-2xl shadow-inner bg-gray-100 skeleton-shimmer' />
          ))}
        </div>
      </section>
  )
}

export default LoadingResumeState
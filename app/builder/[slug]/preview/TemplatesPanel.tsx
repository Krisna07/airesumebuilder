/* eslint-disable @typescript-eslint/no-explicit-any */
const TemplatesPanel = ({ displayTemplate, selectedTemplate, handleTemplateChange, user, templatesRef }:any) => {
  return (
    <div onClick={(e) => e.stopPropagation()} ref={templatesRef} className="w-full space-y-2 z-110  px-2 rounded-2xl pb-4 mb-4 shadow">
      <div className="w-full grid  gap-4 ">
        <div className='font-bold py-2'>Preview Template</div>
        <div className='grid min-[1000px]:grid-cols-2 gap-2'>
          {displayTemplate.map((template:any) => (
            <button key={template.id} onClick={() => handleTemplateChange(template.id)} className={`md:p-3 p-1 rounded-lg border-2 transition-all duration-200 text-left ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'}`}>
              <div className="flex items-center gap-3 justify-left">
                <h3 className={`text-[14px]  ${selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'}`}>{template.name}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
      {!user && (
        <div className="w-full flex flex-col gap-2 items-center justify-center">
          <p>
            Please{' '}
            <a href="/auth/signin" className="text-blue-600 underline">sign in</a>{' '}to access more templates
          </p>
        </div>
      )}
    </div>

  );
};

export default TemplatesPanel
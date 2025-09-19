import React, { ReactNode } from "react";

interface FormLayoutProps {
  children: ReactNode;
  heading: string;
  subheading: string;
}

const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  heading,
  subheading,
}) => {
  return (
    <div className='w-full max-[650px]:w-full max-w-[800px] min-[800px]:min-h-[600px]   p-2   gap-2  grid   shadow-[0_0_4px_0_gray] rounded-lg text-left'>
      <div className='w-full h-full sticky top-0 md:p-4 bg-white z-[10]'>
        <div className='flex items-center gap-[8px] '>
          <h2 className='text-xl font-[600]'>{heading}</h2>
        </div>
        <p>{subheading}</p>
      </div>
      <div className='max-w-full pt-0 relative grid gap-2 overflow-auto px-2 z-[100] pb-4'>{children}</div>
    </div>
  );
};

export default FormLayout;

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
    <div className="w-full min-[650px]:w-[650px]  h-[400px]  p-2   gap-2  grid   shadow-[0_0_4px_0_gray] rounded-lg text-left">
      <div className="w-full h-fit sticky top-0 p-4 bg-white z-20">
        <div className="flex items-center gap-[8px]">
          <h2 className="text-xl font-[600]">{heading}</h2>
        </div>
        <p>{subheading}</p>
      </div>
      <div className=" pt-0 p-4 relative grid gap-2 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default FormLayout;

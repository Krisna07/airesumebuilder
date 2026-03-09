import React, { ReactNode } from "react";

interface FormLayoutProps {
  children: ReactNode;
  heading: string;
  subheading?: string;
  id?: string;
  action?: ReactNode;
}

const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  heading,
  subheading,
  id,
  action,
}) => {
  return (
    <section
      id={id}
      className="w-full max-w-4xl mx-auto flex flex-col  rounded-lg shadow-sm border border-gray-200 "
      role="group"
      aria-label={heading}
    >
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b sticky top-0 z-20 mx-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{heading}</h2>
            {subheading && (
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{subheading}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 space-y-4 relative z-10 ">
        {children}
      </div>
    </section>
  );
};

export default FormLayout;

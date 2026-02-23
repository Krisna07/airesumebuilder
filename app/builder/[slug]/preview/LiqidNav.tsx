import React from 'react';
import { BarChart2Icon, BookTemplateIcon, SettingsIcon } from 'lucide-react';

interface LiquidNavProps {
  reports: boolean;
  showReports: (value: boolean) => void;
  showTemplates: boolean;
  setShowTemplates: (value: boolean) => void;
  menu: boolean;
  showMenu: (value: boolean) => void;
}

const LiquidNav = ({ reports, showReports, showTemplates, setShowTemplates, menu, showMenu }: LiquidNavProps) => {
  
  // Determine position and visibility
  const getGlassStyle = () => {
    if (reports) return { left: '16px', transform: 'translateX(0)' };
    if (showTemplates) return { left: '50%', transform: 'translateX(-50%)' };
    if (menu) return { left: 'calc(100% - 16px)', transform: 'translateX(-100%)' };
    return { opacity: 0, scale: '0.8' }; // Hide if nothing is selected
  };

  return (
    <div className='liquidGlass-wrapper backdrop-blur-[2px] z-20 w-full flex items-center justify-between relative shadow dark:bg-gray-800 bg-gray-200 p-4 overflow-hidden'>
      
      {/* THE LIQUID GLASS INDICATOR */}
      <div 
        className="liquidGlass-wrapper rounded-full  absolute transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
        style={{
          width: '80px',
          height: "80%",
          zIndex: 5,
          ...getGlassStyle()
        }}
      >
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
      </div>

      {/* ICON 1: Reports */}
      <BarChart2Icon 
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => {
          e.stopPropagation();
          showMenu(false);
          setShowTemplates(false);
          showReports(!reports);
        }} 
        className={`relative z-10 left-7 cursor-pointer transition-all duration-300 ${
          reports ? 'text-teal-600 scale-110' : ' hover:text-gray-700 dark:text-gray-400'
        }`} 
      />

      {/* ICON 2: Templates */}
      <BookTemplateIcon
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          showReports(false);
          showMenu(false);
          setShowTemplates(!showTemplates);
        }}
        className={`relative z-10 cursor-pointer transition-all duration-300 ${
          showTemplates ? 'text-teal-600 scale-110' : ' hover:text-gray-700 dark:text-gray-400'
        }`}
      />

      {/* ICON 3: Settings */}
      <SettingsIcon 
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => {
          e.stopPropagation();
          showReports(false);
          setShowTemplates(false);
          showMenu(!menu);
        }} 
        className={`relative z-10 right-7 cursor-pointer transition-all duration-300 ${
          menu ? 'text-teal-600 scale-110 rotate-90' : ' hover:text-gray-700 dark:text-gray-400'
        }`} 
      />

      {/* SVG FILTER DEFINITION */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="glass-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="5" />
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feDisplacementMap in="SourceGraphic" in2="blur" scale="25" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  );
};

export default LiquidNav;
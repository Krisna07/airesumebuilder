import { useRef } from 'react';
import { BarChart2Icon, SettingsIcon, Palette } from 'lucide-react';

interface LiquidNavProps {
  reports: boolean;
  showReports: (value: boolean) => void;
  showStyles: boolean;
  setShowStyles: (value: boolean) => void;
  menu: boolean;
  showMenu: (value: boolean) => void;
}

const LiquidNav = ({ reports, showReports, showStyles, setShowStyles, menu, showMenu }: LiquidNavProps) => {
  // Determine active tab and center the glass indicator over it.
  const activeIndex = reports ? 0 : showStyles ? 1 : menu ? 2 : -1;
  const lastActiveIndexRef = useRef(1);
  if (activeIndex >= 0) {
    lastActiveIndexRef.current = activeIndex;
  }

  const navPaddingPx = 12; // Tailwind p-3
  const tabCount = 3;
  const contentWidthExpr = `100% - ${navPaddingPx * 2}px`;

  const getGlassStyle = () => {
    const positionIndex = activeIndex >= 0 ? activeIndex : lastActiveIndexRef.current;

    return {
      // Keep last X position when closing; only fade/scale for smoother hide.
      left: `calc(${navPaddingPx}px + ((${contentWidthExpr}) / ${tabCount}) * ${positionIndex + 0.5})`,
      top: '50%',
      transform: activeIndex >= 0 ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(0.85)',
      opacity: activeIndex >= 0 ? 1 : 0,
    };
  };

  return (
    <div className='liquidGlass-wrapper backdrop-blur-[2px] z-20 w-full grid grid-cols-3 place-items-center relative shadow dark:bg-gray-800 bg-gray-200 p-3 overflow-hidden'>
      
      {/* THE LIQUID GLASS INDICATOR */}
      <div 
        className="liquidGlass-wrapper rounded-full  absolute transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
        style={{
          width: '56px',
          height: '72%',
          zIndex: 5,
          ...getGlassStyle()
        }}
      >
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
      </div>

      {/* ICON 1: Reports */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          showMenu(false);
          setShowStyles(false);
          showReports(!reports);
        }}
        className="relative z-10 h-9 w-9 grid place-items-center"
        aria-label="Toggle reports"
      >
        <BarChart2Icon
          className={`cursor-pointer transition-all duration-300 ${reports ? 'text-teal-600 scale-110' : 'hover:text-gray-700 dark:text-gray-400'
            }`}
        />
      </button>

      {/* ICON Style */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          showReports(false);
          showMenu(false);
          setShowStyles(!showStyles);
        }}
        className="relative z-10 h-9 w-9 grid place-items-center"
        aria-label="Toggle style editor"
      >
        <Palette
          className={`cursor-pointer transition-all duration-300 ${showStyles ? 'text-teal-600 scale-110' : 'hover:text-gray-700 dark:text-gray-400'
            }`}
        />
      </button>

      {/* ICON 3: Settings */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          showReports(false);
          setShowStyles(false);
          showMenu(!menu);
        }}
        className="relative z-10 h-9 w-9 grid place-items-center"
        aria-label="Toggle menu"
      >
        <SettingsIcon
          className={`cursor-pointer transition-all duration-300 ${menu ? 'text-teal-600 scale-110 rotate-90' : 'hover:text-gray-700 dark:text-gray-400'
            }`}
        />
      </button>

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
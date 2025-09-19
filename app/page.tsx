
import FeaturesSection from '@/components/LandingPageComponents/FeaturesSection';
import HeroSection from '@/components/LandingPageComponents/Herosection';
import TemplatesSection from '@/components/LandingPageComponents/TemplateSection';
import React from 'react';

const page = () => {
  return (
    <div className='w-full text-center  flex flex-col items-center justify-center gap-8  min-h-[60vh] px-4 box-border'>
      <HeroSection />
      <FeaturesSection />
      <TemplatesSection />
    </div>
  );
};

export default page;

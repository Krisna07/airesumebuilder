import FeaturesSection from '@/components/LandingPageComponents/FeaturesSection';
import HeroSection from '@/components/LandingPageComponents/Herosection';
import TemplatesSection from '@/components/LandingPageComponents/TemplateSection';
import HowItWorksSection from '@/components/LandingPageComponents/HowItWorksSection';
import BenefitsSection from '@/components/LandingPageComponents/BenefitsSection';
import CTASection from '@/components/LandingPageComponents/CTASection';


const page = () => {
  return (
    <div className='w-full flex flex-col items-center justify-center min-h-[60vh]'>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TemplatesSection />
      <BenefitsSection />
      <CTASection />
    </div>
  );
};

export default page;

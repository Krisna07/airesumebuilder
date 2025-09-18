import React from 'react';
import Link from 'next/link';
import Button from '../UI/Button';

type HeroProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  illustrationSrc?: string;
  illustrationAlt?: string;
};

const HeroSection: React.FC<HeroProps> = ({
  title = 'Build your résumé with AI — fast.',
  subtitle = 'Generate tailored, ATS-friendly résumés and cover letters in minutes. Pick a template, refine with AI, and export PDF.',
  ctaLabel = 'Start building',
  ctaHref = '/builder',
  secondaryLabel = 'See templates'
}) => {
  const [left, right] = title.split('—').map((s) => s.trim());

  return (
    <header className='w-full py-12' role='banner' aria-label='Landing hero'>
      <div className='max-w-6xl mx-auto px-6 lg:px-8 grid place-items-center  gap-8 items-center'>
        <div>
          <p className='inline-block text-sm font-medium text-gray-900  bg-gradient-to-tr from-indigo-400/25 to-gray-300/50 rounded-e-full rounded-tl-full border-2 border-dashed px-2 py-1 rounded-md mb-4'>New · AI-powered · Easy</p>

          <h1 className='mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-slate-900'>
            {right ? (
              <>
                <span className='block'>{left}</span>
                <span className='block text-sky-600'>— {right}</span>
              </>
            ) : (
              title
            )}
          </h1>

          <p className='mt-4 text-base text-slate-600 max-w-2xl'>{subtitle}</p>

          <div className='w-full mt-8 flex flex-wrap items-center justify-center gap-3'>
            <Button variant='primary' size='medium'>
              {' '}
              <Link href={ctaHref} className='inline-flex items-center justify-center  rounded-md  font-semibold shadow '>
                {ctaLabel}
              </Link>
            </Button>

              <Button variant='secondary' size='medium' >
              
                {secondaryLabel}
            
            </Button>
           
          </div>

          <p className='mt-4 text-xs text-slate-500'>Free plan available · No credit card required · Export PDF</p>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;

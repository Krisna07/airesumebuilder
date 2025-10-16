'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface UniversalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}

const UniversalImage: React.FC<UniversalImageProps> = ({
  src,
  alt,
  width = 32,
  height = 32,
  className = '',
  priority = false,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isExternal, setIsExternal] = useState(false);

  useEffect(() => {
    // Check if the image is external (not from our domain)
    const isExternalImage = src.startsWith('http') && (typeof window !== 'undefined' && !src.includes(window.location.hostname));
    setIsExternal(isExternalImage);
  }, [src]);

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Always use regular img tag for external images or when there's an error
  if (isExternal || imageError || src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
      />
    );
  }

  // Use Next.js Image for internal images only
  try {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    );
  } catch {
    // Fallback to regular img if Next.js Image fails
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
      />
    );
  }
};

export default UniversalImage;
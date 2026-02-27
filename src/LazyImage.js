import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ImageContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  opacity: ${props => props.$isLoaded ? 1 : 0.3};
  filter: ${props => props.$isLoaded ? 'blur(0.5px)' : 'blur(2px)'};
  border-radius: 60px 60px 80px 80px / 20px 20px 60px 60px;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  transition: opacity 0.5s ease, filter 0.5s ease;
  
  @media (max-width: 768px) {
    opacity: ${props => props.$isLoaded ? 0.9 : 0.3};
    filter: ${props => props.$isLoaded ? 'blur(0.3px)' : 'blur(1px)'};
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 60px 60px 80px 80px / 20px 20px 60px 60px;
`;

const LazyImage = ({ src, alt, className, $isLoaded }) => {
  const [isLoaded, setIsLoaded] = useState($isLoaded || false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  // Default fallback image
  const defaultImage = '/images/default-jar.svg';

  // Use default image if src is null/undefined or has error
  const imageSrc = hasError || !src ? defaultImage : src;

  // Performance: Detect WebP support
  // const supportsWebP = () => {
  //   if (typeof window === 'undefined') return false;
  //   const canvas = document.createElement('canvas');
  //   canvas.width = 1;
  //   canvas.height = 1;
  //   return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  // };

  // Performance: Convert to WebP if supported
  const getOptimizedSrc = (originalSrc) => {
    // Disable WebP conversion for now to fix loading issues
    return originalSrc;
    
    // if (!supportsWebP() || hasError) return originalSrc;
    
    // Only convert JPG/JPEG to WebP, keep PNG as-is for transparency
    // if (originalSrc.endsWith('.jpg') || originalSrc.endsWith('.jpeg')) {
    //   return originalSrc.replace(/\.(jpg|jpeg)$/, '.webp');
    // }
    // return originalSrc; // Don't convert PNG to preserve transparency
  };

  // Performance: Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Performance: Load image only when in view
  useEffect(() => {
    if (!isInView) return;

    // Don't try to optimize the default SVG
    const optimizedSrc = (imageSrc === defaultImage) ? imageSrc : getOptimizedSrc(imageSrc);
    
    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      // If we haven't already failed and this isn't default image, try fallback
      if (!hasError && imageSrc !== defaultImage) {
        setHasError(true);
      } else {
        // Even default image failed, set as loaded to show something
        setIsLoaded(true);
      }
    };
    
    img.src = optimizedSrc;
  }, [isInView, imageSrc, hasError, defaultImage]);

  return (
    <ImageContainer
      ref={imgRef}
      $isLoaded={isLoaded}
      className={className}
    >
      {isLoaded && (
        <StyledImage 
          src={imageSrc}
          alt={alt}
          style={{ opacity: 1 }}
        />
      )}
    </ImageContainer>
  );
};

export default LazyImage;

import React from 'react';
import { convertToDirectImageUrl, handleImageError, type ImageWithFallbackProps } from '@/utils/imageUtils';

/**
 * Enhanced image component with automatic fallback handling
 */
export default function ImageWithFallback({
  src,
  alt,
  className = '',
  width = 300,
  height = 300,
  fallbackText,
  onLoad,
  ...props
}: ImageWithFallbackProps & React.ImgHTMLAttributes<HTMLImageElement>) {
  
  // Convert the source URL to a direct image URL or fallback
  const processedSrc = convertToDirectImageUrl(src);
  
  return (
    <img
      src={processedSrc}
      alt={alt}
      className={className}
      onError={(e) => handleImageError(e, fallbackText || alt, width, height)}
      onLoad={onLoad}
      {...props}
    />
  );
}
// Image utility functions for handling image URLs and fallbacks

/**
 * Checks if a URL is likely to be a direct image URL
 */
export const isDirectImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
  if (imageExtensions.test(url)) return true;
  
  // Check for common image hosting patterns
  const imageHostPatterns = [
    /via\.placeholder\.com/,
    /picsum\.photos/,
    /images\.unsplash\.com/,
    /pixabay\.com.*\.(jpg|png|webp)/i,
    /pexels\.com.*\.(jpg|png|webp)/i
  ];
  
  return imageHostPatterns.some(pattern => pattern.test(url));
};

/**
 * Gets a fallback image URL based on size requirements
 */
export const getFallbackImageUrl = (width: number = 300, height: number = 300, text?: string): string => {
  const displayText = text ? encodeURIComponent(text) : 'No+Image';
  return `https://via.placeholder.com/${width}x${height}/374151/9CA3AF?text=${displayText}`;
};

/**
 * Handles image error events with appropriate fallback
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>, 
  fallbackText?: string,
  width?: number,
  height?: number
) => {
  const target = event.target as HTMLImageElement;
  const fallbackUrl = getFallbackImageUrl(width, height, fallbackText);
  
  // Prevent infinite loop if fallback also fails
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
};

/**
 * Converts various URL formats to direct image URLs where possible
 */
export const convertToDirectImageUrl = (url: string): string => {
  if (!url) return getFallbackImageUrl();
  
  // Already a direct image URL
  if (isDirectImageUrl(url)) return url;
  
  // Handle Google search URLs (extract image from search if possible)
  if (url.includes('google.com/search')) {
    // For Google search URLs, we can't extract the actual image, use fallback
    return getFallbackImageUrl(300, 300, 'Invalid+Google+Search');
  }
  
  // Handle Freepik URLs (these are webpage URLs, not direct images)
  if (url.includes('freepik.com')) {
    return getFallbackImageUrl(300, 300, 'Freepik+Webpage');
  }
  
  // Handle other non-image URLs
  if (url.startsWith('http') && !isDirectImageUrl(url)) {
    return getFallbackImageUrl(300, 300, 'Webpage+URL');
  }
  
  // Return as-is if we can't determine the type
  return url;
};

/**
 * Enhanced image component props for consistent error handling
 */
export interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackText?: string;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}
// Utility functions for handling images and broken URLs

// Function to create a placeholder image URL
export const createPlaceholderImage = (
  text: string = 'User',
  size: number = 100,
  bgColor: string = '#e5e7eb',
  textColor: string = '#6b7280'
): string => {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" 
            fill="${textColor}" text-anchor="middle" dy=".3em">
        ${text.charAt(0).toUpperCase()}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Default fallback images - using data URLs to avoid file dependency
export const DEFAULT_PROFILE_IMAGE = createPlaceholderImage('User', 100, '#e5e7eb', '#6b7280');
export const DEFAULT_POST_IMAGE = createPlaceholderImage('Post', 200, '#f3f4f6', '#9ca3af');

// Function to check if an image URL is valid
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Function to get a safe image URL with fallback
export const getSafeImageUrl = (
  imageUrl: string | null | undefined, 
  fallbackUrl: string = DEFAULT_PROFILE_IMAGE
): string => {
  if (!imageUrl || !isValidImageUrl(imageUrl)) {
    return fallbackUrl;
  }
  
  // Check if the domain is accessible
  const domain = new URL(imageUrl).hostname;
  if (domain === 'file.adtip.in' || domain.includes('cloudfront.net')) {
    // These domains are not resolving, use fallback
    return fallbackUrl;
  }
  
  return imageUrl;
};

// Function to handle image load errors
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = DEFAULT_PROFILE_IMAGE
) => {
  const img = event.target as HTMLImageElement;
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    img.onerror = null; // Prevent infinite loop
  }
};

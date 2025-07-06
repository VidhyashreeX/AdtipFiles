// src/utils/colorUtils.ts

// Predefined colors for profile images
const PROFILE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Orange
  '#82E0AA', // Light Green
  '#F1948A', // Light Red
  '#85C1E9', // Sky Blue
  '#D7BDE2', // Lavender
  '#FAD7A0', // Peach
  '#A9DFBF', // Mint Green
  '#F9E79F', // Light Yellow
  '#D5A6BD', // Rose
  '#A3E4D7', // Aqua
];

/**
 * Generate a consistent color for a user based on their ID
 * @param userId - The user's ID
 * @returns A hex color string
 */
export const getUserProfileColor = (userId: number): string => {
  const index = userId % PROFILE_COLORS.length;
  return PROFILE_COLORS[index];
};

/**
 * Generate initials from a name
 * @param name - The user's name
 * @returns Initials string (max 2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '?';
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return '?';
  
  const words = trimmedName.split(' ').filter(word => word.length > 0);
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get a random color from the predefined palette
 * @returns A hex color string
 */
export const getRandomProfileColor = (): string => {
  const randomIndex = Math.floor(Math.random() * PROFILE_COLORS.length);
  return PROFILE_COLORS[randomIndex];
}; 
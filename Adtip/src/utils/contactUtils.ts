/**
 * Contact-related utility functions
 */

import { Contact } from '../types/api';

/**
 * Gets a proper display name for a contact, with improved fallback logic
 */
export const getContactDisplayName = (contact: Contact | null | undefined): string => {
  if (!contact) {
    return 'Anonymous User';
  }

  // Check if name exists and is not empty/whitespace
  if (contact.name && contact.name.trim() !== '') {
    return contact.name.trim();
  }

  // Check if emailId exists for fallback
  if (contact.emailId && contact.emailId.trim() !== '') {
    // Extract username from email if available
    const emailUsername = contact.emailId.split('@')[0];
    if (emailUsername && emailUsername.trim() !== '') {
      return emailUsername.trim();
    }
  }

  // Ultimate fallback with user ID
  return `User ${contact.id}`;
};

/**
 * Gets the first letter for avatar display
 */
export const getContactInitial = (contact: Contact | null | undefined): string => {
  if (!contact) {
    return 'A';
  }

  const displayName = getContactDisplayName(contact);
  return displayName.charAt(0).toUpperCase();
};

/**
 * Checks if a contact has a proper name (not just fallback)
 */
export const hasProperName = (contact: Contact | null | undefined): boolean => {
  if (!contact) {
    return false;
  }

  return !!(contact.name && contact.name.trim() !== '');
};
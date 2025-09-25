/**
 * Profile validation utilities for EditProfile screen
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ProfileData {
  name: string;
  email: string;
  bio: string;
  profession: string;
  gender: string;
  dateOfBirth: string;
  mobile_number: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate mobile number format
 */
export const validateMobileNumber = (mobile: string): boolean => {
  // Allow Indian mobile numbers (10 digits starting with 6, 7, 8, 9)
  const mobileRegex = /^[6-9]\d{9}$/;
  const cleanMobile = mobile.replace(/\D/g, ''); // Remove non-digits
  return mobileRegex.test(cleanMobile);
};

/**
 * Validate date of birth (must be at least 13 years old)
 */
export const validateDateOfBirth = (dateString: string): { isValid: boolean; error?: string } => {
  if (!dateString) {
    return { isValid: true }; // Optional field
  }

  const birthDate = new Date(dateString);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  // Check if date is in the future
  if (birthDate > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  // Check minimum age (13 years)
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 13);
  
  if (birthDate > minDate) {
    return { isValid: false, error: 'You must be at least 13 years old' };
  }

  // Check maximum age (120 years)
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() - 120);
  
  if (birthDate < maxDate) {
    return { isValid: false, error: 'Please enter a valid date of birth' };
  }

  return { isValid: true };
};

/**
 * Validate name field
 */
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }
  
  // Check for inappropriate characters (allow letters, spaces, apostrophes, hyphens)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, apostrophes, and hyphens' };
  }
  
  return { isValid: true };
};

/**
 * Validate bio field
 */
export const validateBio = (bio: string): { isValid: boolean; error?: string } => {
  if (bio.length > 150) {
    return { isValid: false, error: 'Bio must be less than 150 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validate profession selection
 */
export const validateProfession = (profession: string): { isValid: boolean; error?: string } => {
  if (!profession || profession === 'Select your profession' || profession.trim() === '') {
    return { isValid: false, error: 'Please select your profession' };
  }
  
  return { isValid: true };
};

/**
 * Comprehensive profile validation
 */
export const validateProfile = (profileData: ProfileData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate name
  const nameValidation = validateName(profileData.name);
  if (!nameValidation.isValid) {
    errors.push({ field: 'name', message: nameValidation.error! });
  }

  // Validate email
  if (profileData.email.trim()) {
    if (!validateEmail(profileData.email.trim())) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
  }

  // Validate bio
  const bioValidation = validateBio(profileData.bio);
  if (!bioValidation.isValid) {
    errors.push({ field: 'bio', message: bioValidation.error! });
  }

  // Validate profession
  const professionValidation = validateProfession(profileData.profession);
  if (!professionValidation.isValid) {
    errors.push({ field: 'profession', message: professionValidation.error! });
  }

  // Validate mobile number
  if (profileData.mobile_number.trim()) {
    if (!validateMobileNumber(profileData.mobile_number.trim())) {
      errors.push({ field: 'mobile_number', message: 'Please enter a valid 10-digit mobile number' });
    }
  }

  // Validate date of birth
  const dobValidation = validateDateOfBirth(profileData.dateOfBirth);
  if (!dobValidation.isValid) {
    errors.push({ field: 'dateOfBirth', message: dobValidation.error! });
  }

  return errors;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return errors.map((error, index) => `${index + 1}. ${error.message}`).join('\n');
};
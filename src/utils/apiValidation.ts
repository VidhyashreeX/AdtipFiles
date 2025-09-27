/**
 * API Validation Utility
 * 
 * This utility helps validate data before sending to API endpoints to prevent 500 errors
 */

/**
 * Validates product data before sending to API
 * 
 * @param productData The product data object to validate
 * @returns Object with isValid boolean and errors array
 */
export const validateProductData = (productData: any) => {
  const errors: string[] = [];
  
  // Required fields check
  const requiredFields = [
    'name', 'description', 'price', 'company_id', 'category_id', 
    'sub_category_id', 'units_available', 'primary_image'
  ];
  
  for (const field of requiredFields) {
    if (productData[field] === undefined || productData[field] === null || productData[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  
  // Numeric fields check - should be numbers and not strings
  const numericFields = ['price', 'units_available', 'shipping_fee', 'replacement_days', 'warranty_days'];
  
  for (const field of numericFields) {
    if (productData[field] !== undefined && productData[field] !== null) {
      if (isNaN(Number(productData[field]))) {
        errors.push(`${field} must be a number`);
      }
    }
  }
  
  // Check if company_id exists
  if (!productData.company_id) {
    errors.push('No company selected. Please select a company first.');
  }
  
  // Validate images
  if (!productData.primary_image) {
    errors.push('Primary product image is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates post data before sending to API
 * 
 * @param postData The post data object to validate
 * @returns Object with isValid boolean and errors array
 */
export const validatePostData = (postData: any) => {
  const errors: string[] = [];
  
  // Required fields check
  const requiredFields = [
    'title', 'description', 'company_id'
  ];
  
  for (const field of requiredFields) {
    if (postData[field] === undefined || postData[field] === null || postData[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  
  // Check length limits to prevent server validation errors
  if (postData.title && postData.title.length > 100) {
    errors.push('Title exceeds maximum length (100 characters)');
  }
  
  if (postData.description && postData.description.length > 1000) {
    errors.push('Description exceeds maximum length (1000 characters)');
  }
  
  // Check if company_id exists
  if (!postData.company_id) {
    errors.push('No company selected. Please select a company first.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to get selected company ID from localStorage
 * This helps prevent errors with missing company ID
 * 
 * @returns The company ID or null if not found
 */
export const getSelectedCompanyId = (): string | null => {
  try {
    const selectedCompany = localStorage.getItem('selectedCompany');
    if (selectedCompany) {
      const companyData = JSON.parse(selectedCompany);
      return companyData.id?.toString() || null;
    }
  } catch (error) {
    console.error('Error getting selected company ID:', error);
  }
  return null;
};
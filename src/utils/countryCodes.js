// src/utils/countryCodes.js
export const getCountryCallingCode = async (countryCode) => {
  try {
    // Use a free API to get country calling codes
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].idd) {
      const idd = data[0].idd;
      const root = idd.root || '';
      const suffixes = idd.suffixes || [];
      
      if (suffixes.length > 0) {
        return `${root}${suffixes[0]}`; // Usually the first suffix is the main code
      }
      return root;
    }
    
    return '+27'; // Fallback to South Africa
    
  } catch (error) {
    console.error('Country code API error:', error);
    return '+27'; // Fallback to South Africa
  }
};

// Optional: Cache for better performance
const countryCodeCache = new Map();

export const getCachedCountryCallingCode = async (countryCode) => {
  if (countryCodeCache.has(countryCode)) {
    return countryCodeCache.get(countryCode);
  }
  
  const code = await getCountryCallingCode(countryCode);
  countryCodeCache.set(countryCode, code);
  return code;
};
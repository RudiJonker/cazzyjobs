// src/constants/theme.js

export const COLORS = {
  // Primary Brand Colors
  primary: '#4361EE',  // A confident, friendly blue
  primaryDark: '#3A56D4', // A slightly darker blue for pressed states

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F7FAFC', // Very light gray for backgrounds
  gray500: '#718096', // Medium gray for placeholder text
  gray700: '#2D3748', // Dark gray for primary text
  gray900: '#1A202C', // Very dark gray for headings

  // Semantic Colors
  success: '#48BB78', // Green for success messages
  warning: '#ECC94B', // Yellow for warnings
  error: '#E53E3E',   // Red for errors
};

export const SIZES = {
  // Global sizes
  xSmall: 10,
  small: 12,
  medium: 14,
  large: 16,
  xLarge: 18,
  xxLarge: 24,

  // Global spacing
  padding: 16,
  margin: 16,
  radius: 8,
};

export const FONTS = {
  // We'll use the system default fonts for maximum compatibility
  // We can define weights for clarity
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

// Combine everything into a main theme object for easy import
const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
// src/constants/styles.js

import { StyleSheet } from 'react-native';
import { COLORS, SIZES } from './theme';

// Global, reusable styles
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    padding: SIZES.padding,
  },
  screenHeader: {
    fontSize: SIZES.xxLarge,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: SIZES.margin,
  },
  textBody: {
    fontSize: SIZES.medium,
    color: COLORS.gray700,
    lineHeight: SIZES.large, // Better readability for paragraphs
  },
  
  // ADD THESE MISSING STYLES:
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray500,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    fontSize: SIZES.medium,
    backgroundColor: COLORS.white,
  },
  label: {
    color: COLORS.gray700,
    marginBottom: 5,
    fontWeight: '500',
    fontSize: SIZES.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontWeight: '600',
  },
});
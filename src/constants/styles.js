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
  // We will add more global styles as we build the app
});
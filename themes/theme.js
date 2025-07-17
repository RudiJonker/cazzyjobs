import { DefaultTheme } from 'react-native-paper';

       export const theme = {
         ...DefaultTheme,
         colors: {
           primary: '#48d22b', // Green for actions
           accent: '#ff4500', // Orange for highlights
           background: '#f5f5f5', // Light gray background
           text: '#333', // Dark text for readability
           error: '#b00020', // Red for errors
         },
         fonts: {
           regular: {
             fontFamily: 'Roboto',
             fontWeight: 'normal',
           },
           medium: {
             fontFamily: 'Roboto',
             fontWeight: '500',
           },
           bold: {
             fontFamily: 'Roboto',
             fontWeight: 'bold',
           },
         },
       };
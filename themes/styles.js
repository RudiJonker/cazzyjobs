import { StyleSheet } from 'react-native';

   export const styles = StyleSheet.create({
     container: {
       flex: 1,
       padding: 16,
       backgroundColor: '#f5f5f5',
       justifyContent: 'center', // Keeps content vertically centered
     },
     logo: {
       width: 150, // Adjust based on your logo size
       height: 150, // Adjust based on your logo size
       marginBottom: 20, // Space below logo
       alignSelf: 'center', // Ensures horizontal centering
       marginTop: -60, // Moves logo up slightly (adjust as needed)
     },
     title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
     tagline: { color: '#333', marginBottom: 16, textAlign: 'center' },
     button: { marginTop: 16, backgroundColor: '#48d22b' },
   });
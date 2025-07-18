import React, { useState } from 'react';
     import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
     import { Button } from 'react-native-paper';

     export default function LoginScreen({ navigation }) {
       const [email, setEmail] = useState('');
       const [password, setPassword] = useState('');

       return (
         <ScrollView contentContainerStyle={styles.scrollContainer}>
           <View style={styles.container}>
             <TextInput
               style={styles.input}
               value={email}
               onChangeText={setEmail}
               placeholder="Email"
               keyboardType="email-address"
               autoCapitalize="none"
             />
             <TextInput
               style={styles.input}
               value={password}
               onChangeText={setPassword}
               placeholder="Password"
               secureTextEntry
             />
             <Button
               mode="contained"
               style={styles.button}
               onPress={() => {}}
               accessibilityLabel="Log in to CazzyJobs"
             >
               Log In
             </Button>
             <Text
               style={styles.link}
               onPress={() => navigation.navigate('Signup')}
             >
               Don’t have an account? Sign Up
             </Text>
           </View>
         </ScrollView>
       );
     }

     const styles = StyleSheet.create({
       scrollContainer: {
         flexGrow: 1,
         justifyContent: 'center',
       },
       container: {
         padding: 16,
         backgroundColor: '#f5f5f5', // Changed to match Welcome and Signup
       },
       input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
       button: { marginTop: 16, backgroundColor: '#48d22b' },
       link: { color: '#48d22b', textAlign: 'center', marginTop: 12 },
     });
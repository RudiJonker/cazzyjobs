import React, { useState } from 'react';
     import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
     import { Button } from 'react-native-paper';
     import CountryPicker from 'react-native-country-picker-modal';
     import RadioGroup from 'react-native-radio-buttons-group';

     export default function SignupScreen({ navigation }) {
       const [email, setEmail] = useState('');
       const [phone, setPhone] = useState('');
       const [password, setPassword] = useState('');
       const [countryCode, setCountryCode] = useState('ZA'); // Default to South Africa
       const [role, setRole] = useState('jobseeker'); // Default role

       const radioButtons = [
         { id: 'jobseeker', label: 'Job Seeker', value: 'jobseeker' },
         { id: 'employer', label: 'Employer', value: 'employer' },
       ];

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
             <View style={styles.phoneContainer}>
               <CountryPicker
                 withFilter
                 withFlag
                 countryCode={countryCode}
                 withCountryNameButton={false} // Keep only flag
                 onSelect={(country) => setCountryCode(country.cca2)}
               />
               <TextInput
                 style={styles.phoneInput}
                 value={phone}
                 onChangeText={setPhone}
                 placeholder="Phone"
                 keyboardType="phone-pad"
               />
             </View>
             <Text style={styles.label}>Select Role:</Text>
             <RadioGroup
               radioButtons={radioButtons}
               onPress={(id) => setRole(id)}
               selectedId={role}
               layout="row"
               containerStyle={styles.radioGroup}
             />
             <Button
               mode="contained"
               style={styles.button}
               onPress={() => {}}
               accessibilityLabel="Sign up for CazzyJobs"
             >
               Sign Up
             </Button>
             <Text
               style={styles.link}
               onPress={() => navigation.navigate('Login')}
             >
               Already have an account? Log In
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
         backgroundColor: '#ggg',
       },
       phoneContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
       phoneInput: { flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1, padding: 8, borderRadius: 4 },
       input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
       label: { fontSize: 16, color: '#333', marginBottom: 8 },
       radioGroup: { marginBottom: 12 },
       button: { marginTop: 16, backgroundColor: '#48d22b' },
       link: { color: '#48d22b', textAlign: 'center', marginTop: 12 },
     });
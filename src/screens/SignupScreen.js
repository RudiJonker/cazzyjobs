import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import CountryPicker from 'react-native-country-picker-modal';
import RadioGroup from 'react-native-radio-buttons-group';
import { supabase } from '../services/supabase';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('ZA'); // Default to South Africa
  const [role, setRole] = useState('job_seeker');

  const radioButtons = [
    { id: 'job_seeker', label: 'Job Seeker', value: 'job_seeker' },
    { id: 'employer', label: 'Employer', value: 'employer' },
  ];

  const handleSignup = async () => {
    if (!email || !phone || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email, phone')
      .or(`email.eq.${email},phone.eq.${phone}`);
    if (checkError) {
      Alert.alert('Error', 'Error checking existing users');
      return;
    }
    if (existingUsers.length > 0) {
      Alert.alert('Error', 'Email or phone already registered');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { phone: `+${countryCode}${phone}`, role },
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const userId = data.user.id; // Ensure this is used
      console.log('Signup userId:', userId); // Debug
      const { error: insertError } = await supabase.from('users').insert({
        email,
        phone: `+${countryCode}${phone}`,
        role,
        auth_users_id: userId, // Explicitly set auth_users_id
      });

      if (insertError) {
        console.log('Insert error:', insertError.message);
        Alert.alert('Success', 'Account created! Please complete your profile later.');
      } else {
        Alert.alert('Success', 'Successfully Signed Up! Please check your email for verification.');
      }

      if (role === 'job_seeker') {
        navigation.navigate('JobSeekerProfile');
      } else {
        navigation.navigate('EmployerProfile');
      }
    }
  };

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
            withCountryNameButton={false}
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
          onPress={handleSignup}
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
    backgroundColor: '#f5f5f5',
  },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  phoneInput: { flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1, padding: 8, borderRadius: 4 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
  label: { fontSize: 16, color: '#333', marginBottom: 8 },
  radioGroup: { marginBottom: 12 },
  button: { marginTop: 16, backgroundColor: '#48d22b' },
  link: { color: '#48d22b', textAlign: 'center', marginTop: 12 },
});
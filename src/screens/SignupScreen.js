import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import RadioGroup from 'react-native-radio-buttons-group';
import { supabase } from '../services/supabase';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('job_seeker');

  const radioButtons = [
    { id: 'job_seeker', label: 'Job Seeker', value: 'job_seeker' },
    { id: 'employer', label: 'Employer', value: 'employer' },
  ];

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email);
    if (checkError) {
      Alert.alert('Error', 'Error checking existing users');
      return;
    }
    if (existingUsers.length > 0) {
      Alert.alert('Error', 'Email already registered');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const userId = data.user.id;
      console.log('Signup userId:', userId);
      const { error: insertError } = await supabase.from('users').insert({
        id: userId, // Set id to match auth.uid()
        email,
        role,
        auth_users_id: userId, // Keep this for reference if needed
      });

      if (insertError) {
        console.log('Insert error:', insertError.message);
        Alert.alert('Error', 'Failed to create user profile. Check console.');
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
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
  label: { fontSize: 16, color: '#333', marginBottom: 8 },
  radioGroup: { marginBottom: 12 },
  button: { marginTop: 16, backgroundColor: '#48d22b' },
  link: { color: '#48d22b', textAlign: 'center', marginTop: 12 },
});
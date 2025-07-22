// src/screens/AuthScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { supabase } from '../supabase';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('job_seeker');
  const [error, setError] = useState('');

  const phoneRegex = /^\+\d{10,12}$/; // Matches + followed by 10-12 digits

  const handleSignUp = async () => {
    if (!phoneRegex.test(phone)) {
      setError('Phone number must start with + and contain 10-12 digits');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'temporary_password', // Adjust based on your auth flow
      phone,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Insert user into users table with role and phone
    const { error: profileError } = await supabase
      .from('users')
      .insert([{ auth_users_id: data.user.id, role, phone }]);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    navigation.navigate('ProfileScreen', { role });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone (+12345678901)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Role (job_seeker/employer)"
        value={role}
        onChangeText={setRole}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 },
  error: { color: 'red', marginBottom: 10 },
});
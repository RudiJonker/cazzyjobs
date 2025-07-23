import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { theme } from '../../themes/theme';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('job_seeker');
  const [error, setError] = useState('');

  const phoneRegex = /^\+\d{10,12}$/;

  const handleSignUp = async () => {
    if (!phoneRegex.test(phone)) {
      setError('Phone number must start with + and contain 10-12 digits');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      phone,
      password: 'temporary_password',
    });

    if (error) {
      setError(error.message);
      return;
    }

    console.log('Signup userId:', data.user.id);

    const { error: profileError } = await supabase
      .from('users')
      .insert([{ auth_users_id: data.user.id, role, phone, email }]);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    const targetScreen = role === 'job_seeker' ? 'JobSeekerProfile' : 'EmployerProfile';
    navigation.navigate(targetScreen, { role });
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        theme={theme}
      />
      <TextInput
        label="Phone (+12345678901)"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
        theme={theme}
      />
      <TextInput
        label="Role (job_seeker/employer)"
        value={role}
        onChangeText={setRole}
        mode="outlined"
        style={styles.input}
        theme={theme}
      />
      {error ? <HelperText type="error" visible={error}>{error}</HelperText> : null}
      <Button mode="contained" onPress={handleSignUp} style={styles.button} theme={theme}>
        Sign Up
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.button}
        theme={theme}
      >
        Already have an account? Log In
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { marginVertical: 10 },
  button: { marginVertical: 10 },
});
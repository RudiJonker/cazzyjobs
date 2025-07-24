import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Error', 'Please sign up first.');
        } else {
          Alert.alert('Login Error', error.message);
        }
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        Alert.alert('Error', 'Failed to fetch user data.');
        return;
      }

      const userRole = userData.role;
      if (userRole !== 'job_seeker' && userRole !== 'employer') {
        Alert.alert('Error', 'Invalid user role. Please contact support.');
        return;
      }

      navigation.navigate('Main', { screen: 'Home', params: { userRole } });
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
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
        <Button
          mode="contained"
          style={styles.button}
          onPress={handleLogin}
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
    backgroundColor: '#f5f5f5',
  },
  input: { 
    height: 40, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    marginBottom: 12, 
    padding: 8, 
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  button: { 
    marginTop: 16, 
    backgroundColor: '#48d22b' 
  },
  link: { 
    color: '#48d22b', 
    textAlign: 'center', 
    marginTop: 12 
  },
});
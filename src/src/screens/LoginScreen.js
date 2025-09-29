// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase'; // Add this import

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
  // Basic validation
  if (!email || !password) {
    alert("Please fill in all fields!");
    return;
  }

  try {
    console.log("Logging in...");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("Login error: " + error.message);
      return;
    }

    console.log("Login successful!", data);
        
    // Here we will later navigate to the main app screen
    navigation.navigate('MainTabs');
    
  } catch (error) {
    console.error("Unexpected error:", error);
    alert("An unexpected error occurred. Please try again.");
  }
};

  return (
    <View style={[globalStyles.container, { padding: SIZES.padding }]}>
      <Text style={globalStyles.screenHeader}>Welcome Back</Text>
      
      {/* Email Input */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Email</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Password</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin * 2,
          fontSize: SIZES.medium
        }}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Login Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          alignItems: 'center',
          marginBottom: SIZES.margin * 2
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          Log In
        </Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.gray500, fontSize: SIZES.small }}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={{ color: COLORS.primary, fontSize: SIZES.small, fontWeight: '600' }}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
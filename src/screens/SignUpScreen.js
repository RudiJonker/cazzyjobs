// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';

const SignUpScreen = ({ navigation }) => {
  // State to hold form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('worker'); // 'worker' or 'employer'

  const handleSignUp = () => {
    // Basic validation
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }
    
    console.log("Signing up with:", { email, password, userRole });
    // Here we will later add the Supabase signup logic
  };

  return (
    <ScrollView contentContainerStyle={[globalStyles.container, { padding: SIZES.padding }]}>
      <Text style={globalStyles.screenHeader}>Create Account</Text>
      
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
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="Create a password (min. 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Confirm Password Input */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Confirm Password</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Role Selection */}
      <Text style={{ color: COLORS.gray700, marginBottom: SIZES.margin }}>I want to:</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.margin * 2 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: SIZES.padding,
            backgroundColor: userRole === 'worker' ? COLORS.primary : COLORS.gray100,
            borderRadius: SIZES.radius,
            marginRight: SIZES.margin / 2,
            alignItems: 'center'
          }}
          onPress={() => setUserRole('worker')}
        >
          <Text style={{ color: userRole === 'worker' ? COLORS.white : COLORS.gray700, fontWeight: '600' }}>
            👷 Find Work
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            flex: 1,
            padding: SIZES.padding,
            backgroundColor: userRole === 'employer' ? COLORS.primary : COLORS.gray100,
            borderRadius: SIZES.radius,
            marginLeft: SIZES.margin / 2,
            alignItems: 'center'
          }}
          onPress={() => setUserRole('employer')}
        >
          <Text style={{ color: userRole === 'employer' ? COLORS.white : COLORS.gray700, fontWeight: '600' }}>
            💼 Hire Someone
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          alignItems: 'center'
        }}
        onPress={handleSignUp}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          Sign Up
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.margin * 2 }}>
        <Text style={{ color: COLORS.gray500, fontSize: SIZES.small }}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: COLORS.primary, fontSize: SIZES.small, fontWeight: '600' }}>
            Log In
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SignUpScreen;
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('worker');
  const [loading, setLoading] = useState(false);

  // Check if user already has an account with this role
  const checkExistingRole = async (email, requestedRole) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('email', email)
        .single();
      
      // If no record found, it's okay to proceed
      if (error && error.code === 'PGRST116') {
        return true;
      }
      
      if (error) {
        throw error;
      }
      
      // If record found with same role, prevent signup
      if (data && data.user_role === requestedRole) {
        throw new Error(`You already have a ${requestedRole} account with this email. Please login to your existing account or use a different email address.`);
      }
      
      return true;
    } catch (error) {
      console.error('Role check error:', error);
      throw error;
    }
  };

  const handleSignUp = async () => {
    // Basic validation
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match!");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters!");
      return;
    }

    setLoading(true);

    try {
      console.log("Signing up...");
      
      // First check for existing role
      await checkExistingRole(email, userRole);
      
      // 1. Create the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        Alert.alert("Sign up error", authError.message);
        return;
      }

      // 2. If auth succeeds, create their profile in our 'profiles' table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            user_role: userRole,
            email: email,
          }
        ]);

      if (profileError) {
        Alert.alert("Profile creation error", profileError.message);
        return;
      }

      console.log("Sign up successful!", authData);
      Alert.alert(
        "Success", 
        "Account created successfully! Please check your email for verification.",
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );

    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.margin * 1 }}>
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
          marginTop: 10,
          alignItems: 'center',
          opacity: loading ? 0.7 : 1
        }}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
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
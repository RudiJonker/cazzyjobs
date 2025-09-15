// src/screens/TermsAcceptanceScreen.js
import React, { useState } from 'react';
import { View, ScrollView, Alert, Linking, TouchableOpacity, Text } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons'; // Using Expo Icons instead of react-native-paper

const TermsAcceptanceScreen = ({ route, navigation }) => {
  const { email, password, userRole } = route.params;
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFinalizeSignUp = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      Alert.alert('Required', 'Please accept both Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      console.log("Finalizing sign up...");
      
      // 1. Create the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        Alert.alert("Sign up error", authError.message);
        setLoading(false);
        return;
      }

      // 2. Create their profile with terms acceptance
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            user_role: userRole,
            email: email,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          }
        ]);

      if (profileError) {
        Alert.alert("Profile creation error", profileError.message);
        setLoading(false);
        return;
      }

      console.log("Sign up successful with terms accepted!", authData);
      Alert.alert("Success!", "Account created successfully! Please check your email for verification.");
      
      // Navigate to main app
      navigation.navigate('MainTabs');

    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the link.');
    }
  };

  return (
    <View style={[globalStyles.container, { padding: SIZES.padding }]}>
      <Text style={[globalStyles.screenHeader, { marginBottom: SIZES.margin }]}>
        Review and Accept
      </Text>
      
      <ScrollView style={{ flex: 1, marginBottom: SIZES.margin }}>
        <Text style={{ marginBottom: SIZES.margin, color: COLORS.gray700 }}>
          To use CazzyJobs, please review and accept our terms:
        </Text>

        {/* Terms of Service Section */}
        <Text style={{ fontWeight: 'bold', marginBottom: SIZES.margin / 2, fontSize: SIZES.large }}>
          Terms of Service
        </Text>
        <Text style={{ marginBottom: SIZES.margin, color: COLORS.gray700 }}>
          By using CazzyJobs, you agree to our terms of service. This includes guidelines for posting jobs, applying for work, and communicating with other users. You understand that CazzyJobs is a connection platform only and does not handle financial transactions.
        </Text>

        <TouchableOpacity
          onPress={() => openLink('https://your-domain.com/terms')}
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray500,
            borderRadius: SIZES.radius,
            padding: SIZES.padding,
            marginBottom: SIZES.margin,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: COLORS.primary }}>View Full Terms of Service</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.margin * 2 }}>
          <TouchableOpacity onPress={() => setAcceptedTerms(!acceptedTerms)}>
            <Ionicons 
              name={acceptedTerms ? "checkbox" : "square-outline"} 
              size={24} 
              color={acceptedTerms ? COLORS.primary : COLORS.gray500} 
            />
          </TouchableOpacity>
          <Text style={{ marginLeft: 10 }}>I agree to the Terms of Service</Text>
        </View>

        {/* Privacy Policy Section */}
        <Text style={{ fontWeight: 'bold', marginBottom: SIZES.margin / 2, fontSize: SIZES.large }}>
          Privacy Policy
        </Text>
        <Text style={{ marginBottom: SIZES.margin, color: COLORS.gray700 }}>
          We value your privacy. We collect only necessary information to facilitate connections between workers and employers. Your full address is only shared after you've been hired for a job. We never share your personal information with third parties for marketing purposes.
        </Text>

        <TouchableOpacity
          onPress={() => openLink('https://your-domain.com/privacy')}
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray500,
            borderRadius: SIZES.radius,
            padding: SIZES.padding,
            marginBottom: SIZES.margin,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: COLORS.primary }}>View Full Privacy Policy</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.margin * 2 }}>
          <TouchableOpacity onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}>
            <Ionicons 
              name={acceptedPrivacy ? "checkbox" : "square-outline"} 
              size={24} 
              color={acceptedPrivacy ? COLORS.primary : COLORS.gray500} 
            />
          </TouchableOpacity>
          <Text style={{ marginLeft: 10 }}>I agree to the Privacy Policy</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={handleFinalizeSignUp}
        disabled={!acceptedTerms || !acceptedPrivacy || loading}
        style={{
          backgroundColor: (!acceptedTerms || !acceptedPrivacy || loading) ? COLORS.gray500 : COLORS.primary,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          alignItems: 'center',
          marginTop: 'auto'
        }}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          {loading ? 'Creating Account...' : 'Accept & Create Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TermsAcceptanceScreen;
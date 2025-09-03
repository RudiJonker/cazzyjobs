// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getCityFromDeviceLocation } from '../utils/location';
import PhoneInput from '../components/PhoneInput'; // Add this import

const ProfileScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    city: '',
    bio: '',
    phone: ''
  });
  const [phoneValid, setPhoneValid] = useState(true); // Add phone validation state

  // Fetch user profile
const fetchProfile = async () => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        city: data.city || '',
        bio: data.bio || '',
        phone: data.phone || ''
      });
    }

    // If no city set, try to detect it
    if (!data?.city) {
      const detectedCity = await getCityFromDeviceLocation();
      if (detectedCity) {
        setProfile(prev => ({ ...prev, city: detectedCity }));
      }
    }

  } catch (error) {
    console.error('Error fetching profile:', error);
    alert('Error loading profile');
  } finally {
    setLoading(false);
  }
};

  // Save profile
const saveProfile = async () => {
  try {
    // Validate phone number if provided
    if (profile.phone && !phoneValid) {
      alert('Please enter a valid phone number');
      return;
    }

    setSaving(true);
    
    // First, get the current user role to preserve it
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        user_role: existingProfile?.user_role || 'worker', // Preserve existing role or default
        full_name: profile.full_name,
        city: profile.city,
        bio: profile.bio,
        phone: profile.phone,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    alert('Profile saved successfully!');
    
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Error saving profile: ' + error.message);
  } finally {
    setSaving(false);
  }
};

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>Your Profile</Text>
      <Text style={{ color: COLORS.gray500, marginBottom: SIZES.margin * 2 }}>
        Complete your profile to help employers know you better
      </Text>

      {/* Full Name */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Full Name</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="Enter your full name"
        value={profile.full_name}
        onChangeText={(text) => setProfile({ ...profile, full_name: text })}
      />

      {/* City */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>City</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="Enter your city"
        value={profile.city}
        onChangeText={(text) => setProfile({ ...profile, city: text })}
      />

      {/* Phone Input - Replaced with professional component */}
      <PhoneInput
        value={profile.phone}
        onChangePhone={(phone, isValid) => {
          setProfile({ ...profile, phone });
          setPhoneValid(isValid);
        }}
        defaultCode="ZA" // Default to South Africa
      />

      {/* Bio */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5, marginTop: SIZES.margin }}>Bio</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin * 2,
          fontSize: SIZES.medium,
          height: 100,
          textAlignVertical: 'top'
        }}
        placeholder="Tell employers about yourself, your skills, and experience..."
        value={profile.bio}
        onChangeText={(text) => setProfile({ ...profile, bio: text })}
        multiline
      />

      {/* Save Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          alignItems: 'center',
          opacity: saving ? 0.6 : 1
        }}
        onPress={saveProfile}
        disabled={saving}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;
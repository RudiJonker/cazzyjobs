import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getCityFromDeviceLocation } from '../utils/location';
import PhoneInput from '../components/PhoneInput';

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
  const [phoneValid, setPhoneValid] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
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

  const saveProfile = async () => {
    try {
      if (profile.phone && !phoneValid) {
        alert('Please enter a valid phone number');
        return;
      }

      setSaving(true);
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_role: existingProfile?.user_role || 'worker',
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
    <ScrollView 
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: SIZES.padding *6 }}
    >
      

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

      {/* Phone Input */}
      <PhoneInput
        value={profile.phone}
        onChangePhone={(phone, isValid) => {
          setProfile({ ...profile, phone });
          setPhoneValid(isValid);
        }}
        defaultCode="ZA"
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
          opacity: saving ? 0.6 : 1,
          marginBottom: SIZES.padding * 2,
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
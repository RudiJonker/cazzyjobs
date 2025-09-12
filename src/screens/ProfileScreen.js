import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getCityFromDeviceLocation } from '../utils/location';
import PhoneInput from '../components/PhoneInput';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    city: '',
    bio: '',
    phone: '',
    avatar_url: ''
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
        let avatarUrl = data.avatar_url || '';
        
        if (data.avatar_url && !data.avatar_url.startsWith('data:')) {
          try {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('profile_pic')
              .createSignedUrl(data.avatar_url, 60 * 60);
            
            if (!signedUrlError && signedUrlData) {
              avatarUrl = signedUrlData.signedUrl;
            }
          } catch (urlError) {
            console.log('Error getting signed URL:', urlError);
          }
        }

        setProfile({
          full_name: data.full_name || '',
          city: data.city || '',
          bio: data.bio || '',
          phone: data.phone || '',
          avatar_url: avatarUrl
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
      Alert.alert('Error', 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile_pic')
        .upload(fileName, fileContent, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        await saveBase64Image(uri);
        return;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profile_pic')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        throw signedUrlError;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: signedUrlData.signedUrl }));
      
      Alert.alert('Success', 'Profile picture updated successfully!');

    } catch (error) {
      console.error('Error uploading image:', error);
      await saveBase64Image(uri);
    } finally {
      setUploading(false);
    }
  };

  const saveBase64Image = async (uri) => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const base64Data = `data:image/jpeg;base64,${fileContent}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: base64Data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, avatar_url: base64Data }));
      Alert.alert('Success', 'Profile picture saved! (using fallback method)');
      
    } catch (fallbackError) {
      console.error('Fallback upload failed:', fallbackError);
      Alert.alert('Error', 'Failed to save profile picture');
    }
  };

  const saveProfile = async () => {
    try {
      if (profile.phone && !phoneValid) {
        Alert.alert('Validation Error', 'Please enter a valid phone number');
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
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile saved successfully!');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Error saving profile: ' + error.message);
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: SIZES.padding }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: SIZES.padding * 6, paddingHorizontal: SIZES.padding }}
    >
      <View style={{ alignItems: 'center', marginBottom: SIZES.margin * 2, marginTop: SIZES.margin }}>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: COLORS.primary
              }}
              onError={(e) => {
                console.log('Image load error');
                // Removed the fetchProfile() call that was causing the loop
              }}
            />
          ) : (
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: COLORS.gray300,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: COLORS.gray500
              }}
            >
              <Ionicons name="person" size={50} color={COLORS.gray600} />
            </View>
          )}
          
          {uploading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 60,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <ActivityIndicator color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={pickImage} 
          disabled={uploading}
          style={{ marginTop: SIZES.padding, flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons 
            name={uploading ? "refresh" : "camera"} 
            size={16} 
            color={COLORS.primary} 
          />
          <Text style={{ color: COLORS.primary, marginLeft: 5, fontWeight: '500' }}>
            {uploading ? 'Uploading...' : 'Change Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rest of the form fields remain unchanged */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5, fontWeight: '500' }}>Full Name</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Enter your full name"
        value={profile.full_name}
        onChangeText={(text) => setProfile({ ...profile, full_name: text })}
      />

      <Text style={{ color: COLORS.gray700, marginBottom: 5, fontWeight: '500' }}>City</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Enter your city"
        value={profile.city}
        onChangeText={(text) => setProfile({ ...profile, city: text })}
      />

      <PhoneInput
        value={profile.phone}
        onChangePhone={(phone, isValid) => {
          setProfile({ ...profile, phone });
          setPhoneValid(isValid);
        }}
        defaultCode="ZA"
      />

      <Text style={{ color: COLORS.gray700, marginBottom: 5, marginTop: SIZES.margin, fontWeight: '500' }}>Bio</Text>
      <TextInput
        style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Tell employers about yourself, your skills, and experience..."
        value={profile.bio}
        onChangeText={(text) => setProfile({ ...profile, bio: text })}
        multiline
      />

      <TouchableOpacity
        style={[globalStyles.button, { opacity: saving ? 0.6 : 1 }]}
        onPress={saveProfile}
        disabled={saving}
      >
        <Text style={globalStyles.buttonText}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;
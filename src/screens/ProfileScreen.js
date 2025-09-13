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
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          city: data.city || '',
          bio: data.bio || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || ''
        });

        // If we have a file path, get public URL
        if (data.avatar_url && !data.avatar_url.startsWith('data:')) {
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('profile_pic')
              .getPublicUrl(data.avatar_url);
            
            setProfileImageUrl(publicUrl);
            console.log('Public URL:', publicUrl);
          } catch (urlError) {
            console.log('Error getting public URL:', urlError);
          }
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

      // FIXED: Use the correct MediaTypeOptions approach
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
      
      // Get file info
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      // Use the working approach from your previous code
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Error', 'No active session');
        return;
      }

      // Use FileSystem.uploadAsync like in your working code
      const uploadResponse = await FileSystem.uploadAsync(
        `https://teoggggwogwnspqygdri.supabase.co/storage/v1/object/profile_pic/${fileName}`,
        uri,
        {
          headers: { 
            'Content-Type': mimeType, 
            'Authorization': `Bearer ${session.access_token}`,
            'x-upsert': 'true' // Allow overwriting
          },
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        }
      );

      if (uploadResponse.status !== 200) {
        console.log('Upload failed:', uploadResponse.body);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Update profile with file path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_pic')
        .getPublicUrl(fileName);
      
      setProfileImageUrl(publicUrl);
      setProfile(prev => ({ ...prev, avatar_url: fileName }));
      
      Alert.alert('Success', 'Profile picture updated successfully!');
      console.log('Image uploaded successfully. Public URL:', publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
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
      {/* Profile Picture Section */}
      <View style={{ alignItems: 'center', marginBottom: SIZES.margin * 2, marginTop: SIZES.margin }}>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: COLORS.primary
              }}
              onError={(e) => {
                console.log('Image load error for URL:', profileImageUrl);
                console.log('Error details:', e.nativeEvent.error);
                setProfileImageUrl('');
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

      {/* Rest of the form fields */}
      <Text style={globalStyles.label}>Full Name</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Enter your full name"
        value={profile.full_name}
        onChangeText={(text) => setProfile({ ...profile, full_name: text })}
      />

      <Text style={globalStyles.label}>City</Text>
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

      <Text style={[globalStyles.label, { marginTop: SIZES.margin }]}>Bio</Text>
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
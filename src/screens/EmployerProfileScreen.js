import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Image, Keyboard, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';

export default function EmployerProfileScreen({ route, navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [targetedLocation, setTargetedLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const role = route.params?.role || 'employer';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      Alert.alert('Error', 'Unable to fetch user data');
      return;
    }
    const userId = user.id;
    console.log('Fetching user data for ID:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('email, phone, name, targeted_location, business_name, profile_pic')
      .eq('auth_users_id', userId)
      .single();
    if (error) {
      setEmail(user.email || '');
      setPhone('');
      setName('');
      setTargetedLocation('');
      setBusinessName('');
      setProfilePic(null);
    } else {
      console.log('Fetched data:', data);
      setEmail(data.email || user.email || '');
      setPhone(data.phone || '');
      setName(data.name || '');
      setTargetedLocation(data.targeted_location || '');
      setBusinessName(data.business_name || '');
      setProfilePic(data.profile_pic || null);
    }
    validateFields();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    console.log('Starting image upload with URI:', uri);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    console.log('Generated file name:', fileName);
    console.log('Using bucket name:', 'pics');
    const { error, data } = await supabase.storage
      .from('pics')
      .upload(fileName, {
        uri,
        type: 'image/jpeg',
        cacheControl: '3600',
      });
    if (error) {
      console.log('Upload error details:', error.message, error.code, error.status);
      Alert.alert('Error', 'Failed to upload image. Check console.');
      return null;
    }
    console.log('Upload successful, raw data:', data);
    console.log('Getting public URL for bucket:', 'pics', 'and file:', fileName);
    const { data: urlData } = supabase.storage.from('pics').getPublicUrl(fileName);
    console.log('Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const validateFields = () => {
    const isPhoneValid = phone.trim().length > 0;
    const isNameValid = name.trim().length > 0;
    const isLocationValid = targetedLocation.trim().length > 0;
    const disabled = !(isPhoneValid && isNameValid && isLocationValid);
    setIsSaveDisabled(disabled);
    return !disabled;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      if (!phone.trim().length) Alert.alert('Error', 'Please enter your phone number');
      else if (!name.trim().length) Alert.alert('Error', 'Please enter your name');
      else if (!targetedLocation.trim().length) Alert.alert('Error', 'Please enter your target location');
      return;
    }
    let newProfilePic = profilePic;
    if (profilePic && !profilePic.startsWith('https')) {
      newProfilePic = await uploadImage(profilePic);
      if (!newProfilePic) return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('users').update({
      name,
      targeted_location: targetedLocation,
      phone,
      business_name: businessName,
      profile_pic: newProfilePic,
    }).eq('auth_users_id', user.id);
    if (error) {
      console.log('Update error:', error.message);
      Alert.alert('Error', 'Failed to save profile. Check console.');
    } else {
      console.log('Update successful with profile_pic:', newProfilePic);
      Alert.alert('Success', 'Your profile was saved successfully!');
      navigation.navigate('DashboardScreen', { role });
    }
  };

  useEffect(() => {
    validateFields();
  }, [phone, name, targetedLocation]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
      <View style={styles.container}>
        <Pressable onPress={pickImage}>
          <Image
            source={profilePic ? { uri: profilePic } : require('../../assets/default-avatar.png')}
            style={styles.profilePic}
          />
        </Pressable>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+27123456789"
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name *"
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <TextInput
          style={styles.input}
          value={targetedLocation}
          onChangeText={setTargetedLocation}
          placeholder="Target Location *"
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Business Name (Optional)"
          multiline
          numberOfLines={4}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit={true}
        />
        <Pressable
          style={[styles.button, isSaveDisabled && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaveDisabled}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', paddingTop: 10, paddingBottom: 20 },
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
  profilePic: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 16, marginTop: 8 },
  button: { marginTop: 16, backgroundColor: '#48d22b', padding: 8, borderRadius: 4, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16 },
  buttonDisabled: { backgroundColor: '#cccccc' },
});
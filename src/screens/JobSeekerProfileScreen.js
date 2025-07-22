import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Image, Keyboard, Pressable } from 'react-native';
import { supabase } from '../services/supabase';

export default function JobSeekerProfile({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [targetedLocation, setTargetedLocation] = useState('');
  const [bio, setBio] = useState('');
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

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
    console.log('Signup userId:', userId);
    console.log('Fetching user data for ID:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('email, phone, name, targeted_location, bio, auth_users_id')
      .eq('auth_users_id', userId)
      .single();
    if (error) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setName('');
      setTargetedLocation('');
      setBio('');
    } else {
      console.log('Fetched data:', data);
      setEmail(data.email || user.email || '');
      setPhone(data.phone || '');
      setName(data.name || '');
      setTargetedLocation(data.targeted_location || '');
      setBio(data.bio || '');
    }
    validateFields();
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
      if (!phone.trim().length) {
        Alert.alert('Error', 'Please enter your phone number');
      } else if (!name.trim().length) {
        Alert.alert('Error', 'Please enter your name');
      } else if (!targetedLocation.trim().length) {
        Alert.alert('Error', 'Please enter your target location');
      }
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Saving for user:', user.email, 'ID:', user.id);
    const { error } = await supabase.from('users').update({
      name,
      targeted_location: targetedLocation,
      phone: phone || null,
      bio,
    }).eq('auth_users_id', user.id);
    if (error) {
      console.log('Update error:', error.message);
      Alert.alert('Error', 'Failed to save profile. Check console.');
    } else {
      console.log('Update successful');
      Alert.alert('Success', 'Your profile was saved successfully!');
      navigation.navigate('DashboardScreen');
    }
  };

  useEffect(() => {
    validateFields();
  }, [phone, name, targetedLocation]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
      <View style={styles.container}>
        <Image source={require('../../assets/default-avatar.png')} style={styles.profilePic} />
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
          keyboardType="phone-pad" // Opens numeric keypad
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
          value={bio}
          onChangeText={setBio}
          placeholder="Bio (Optional)"
          multiline
          numberOfLines={4}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit={true}
        />
        <Pressable
          style={styles.button}
          onPress={handleSave}
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
});
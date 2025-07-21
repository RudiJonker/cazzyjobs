import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Button } from 'react-native-paper';
import CountryPicker from 'react-native-country-picker-modal';
import { supabase } from '../services/supabase';

export default function JobSeekerProfile({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [targetedLocation, setTargetedLocation] = useState('');
  const [bio, setBio] = useState('');
  const [countryCode, setCountryCode] = useState('ZA'); // Default to South Africa
  const [originalPhone, setOriginalPhone] = useState(''); // To track changes
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
    const { data, error } = await supabase
      .from('users')
      .select('email, phone, name, targeted_location, bio, auth_users_id')
      .eq('auth_users_id', userId)
      .single();

    if (error) {
      // Fallback to Auth data if users table is empty
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setOriginalPhone(user.phone || '');
      setName('');
      setTargetedLocation('');
      setBio('');
    } else {
      setEmail(data.email || user.email || ''); // Prefer users table, fallback to Auth
      setPhone(data.phone || user.phone || ''); // Prefer users table, fallback to Auth
      setOriginalPhone(data.phone || user.phone || ''); // Store original
      setName(data.name || '');
      setTargetedLocation(data.targeted_location || '');
      setBio(data.bio || '');
    }
  };

  const validateFields = () => {
    const phoneRegex = new RegExp(`^\\+${countryCode}[0-9]{9}$`); // e.g., +27 followed by 9 digits
    const isPhoneValid = phoneRegex.test(phone);
    const isNameValid = name.trim().length > 0;
    const isLocationValid = targetedLocation.trim().length > 0;

    setIsSaveDisabled(!(isPhoneValid && isNameValid && isLocationValid));
    return isPhoneValid && isNameValid && isLocationValid;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      Alert.alert('Error', 'Please fill all required fields with valid data');
      return;
    }

    const userId = (await supabase.auth.getUser()).data.user.id;
    const updatedPhone = phone !== originalPhone ? phone : undefined; // Only update if changed

    const { error } = await supabase.from('users').update({
      name,
      targeted_location: targetedLocation,
      phone: updatedPhone,
      bio,
    }).eq('auth_users_id', userId);

    if (error) {
      Alert.alert('Error', 'Failed to save profile');
    } else if (updatedPhone) {
      const { error: authError } = await supabase.auth.updateUser({ phone: updatedPhone });
      if (authError) {
        Alert.alert('Warning', 'Profile saved, but phone update failed. Contact support.');
      } else {
        Alert.alert('Success', 'Profile saved successfully!');
        navigation.navigate('DashboardScreen');
      }
    } else {
      Alert.alert('Success', 'Profile saved successfully!');
      navigation.navigate('DashboardScreen');
    }
  };

  useEffect(() => {
    validateFields();
  }, [phone, name, targetedLocation, countryCode]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/default-avatar.png')}
          style={styles.profilePic}
        />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />
        <View style={styles.phoneContainer}>
          <CountryPicker
            withFilter
            withFlag
            countryCode={countryCode}
            withCountryNameButton={false}
            onSelect={(country) => setCountryCode(country.cca2)}
          />
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^0-9+]/g, '')); // Allow only numbers and +
            }}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
        </View>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name *"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          value={targetedLocation}
          onChangeText={setTargetedLocation}
          placeholder="Target Location *"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
          placeholder="Bio (Optional)"
          multiline
          numberOfLines={4}
        />
        <Button
          mode="contained"
          style={styles.button}
          onPress={handleSave}
          disabled={isSaveDisabled}
          accessibilityLabel="Save profile"
        >
          Save
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start', // Reduced whitespace by starting content higher
    paddingTop: 10, // Reduced from implicit default padding
  },
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  phoneInput: { flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1, padding: 8, borderRadius: 4 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
  label: { fontSize: 16, color: '#333', marginBottom: 8 },
  profilePic: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 16, marginTop: 8 }, // Reduced top margin
  button: { marginTop: 16, backgroundColor: '#48d22b' },
});
// src/screens/PostJobScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CustomDateTimePicker from '../components/DateTimePicker';

// Common job categories for your app
const JOB_CATEGORIES = [
  'Cleaning',
  'Gardening',
  'Moving',
  'Construction',
  'Painting',
  'Driving',
  'Domestic Work',
  'General Labor'
];

const PostJobScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userCity, setUserCity] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    proposed_wage: '',
    job_city: '',
    full_address: '',
    job_date: null,
    start_time: null,
    end_time: null,
    estimated_hours: 0
  });

  // Fetch user's city from profile
  useEffect(() => {
    const fetchUserCity = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', user.id)
          .single();
        
        if (profile?.city) {
          setUserCity(profile.city);
          setFormData(prev => ({ ...prev, job_city: profile.city }));
        }
      }
    };
    
    fetchUserCity();
  }, [user]);

  // Calculate hours between start and end time
  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const diffMs = end.getTime() - start.getTime();
    return (diffMs / (1000 * 60 * 60)).toFixed(1); // Convert to hours
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title || !formData.category || !formData.proposed_wage || !formData.job_city) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (formData.proposed_wage <= 0) {
      Alert.alert('Invalid Wage', 'Please enter a valid wage amount');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('jobs')
        .insert({
          employer_id: user.id,
          title: formData.title,
          category: formData.category,
          description: formData.description,
          proposed_wage: parseFloat(formData.proposed_wage),
          job_city: formData.job_city,
          full_address: formData.full_address,
          job_date: formData.job_date?.toISOString().split('T')[0], // Format as YYYY-MM-DD
          start_time: formData.start_time?.toTimeString().split(' ')[0], // Format as HH:MM:SS
          end_time: formData.end_time?.toTimeString().split(' ')[0], // Format as HH:MM:SS
          estimated_hours: parseFloat(formData.estimated_hours),
          status: 'active'
        });

      if (error) throw error;

      Alert.alert(
        'Success!', 
        'Job posted successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home') 
          }
        ]
      );
      
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert('Error', 'Failed to post job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>Post a New Job</Text>

      {/* Job Title */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Job Title *</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="e.g., Garden cleanup, House cleaning, Furniture moving"
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
      />

      {/* Category */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Category *</Text>
      <View style={{
        borderWidth: 1,
        borderColor: COLORS.gray500,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin,
        backgroundColor: COLORS.white
      }}>
        <Picker
          selectedValue={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <Picker.Item label="Select a category..." value="" />
          {JOB_CATEGORIES.map(category => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>
      </View>

      {/* Description */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Description</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium,
          height: 100,
          textAlignVertical: 'top'
        }}
        placeholder="Describe the job, required skills, tools needed, etc."
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
      />

      {/* Proposed Wage */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Proposed Wage (ZAR) *</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="e.g., 250"
        keyboardType="numeric"
        value={formData.proposed_wage}
        onChangeText={(text) => setFormData({ ...formData, proposed_wage: text })}
      />

      {/* Job Date */}
      <CustomDateTimePicker
        label="Job Date *"
        value={formData.job_date}
        onChange={(date) => setFormData({ ...formData, job_date: date })}
        mode="date"
        minimumDate={new Date()}
      />

      {/* Start Time */}
      <CustomDateTimePicker
        label="Start Time *"
        value={formData.start_time}
        onChange={(time) => {
          const newData = { ...formData, start_time: time };
          if (formData.end_time) {
            newData.estimated_hours = calculateHours(time, formData.end_time);
          }
          setFormData(newData);
        }}
        mode="time"
      />

      {/* End Time */}
      <CustomDateTimePicker
        label="End Time *"
        value={formData.end_time}
        onChange={(time) => {
          const newData = { ...formData, end_time: time };
          if (formData.start_time) {
            newData.estimated_hours = calculateHours(formData.start_time, time);
          }
          setFormData(newData);
        }}
        mode="time"
      />

      {/* Estimated Hours Display */}
      {formData.estimated_hours > 0 && (
        <View style={{ 
          backgroundColor: COLORS.gray100, 
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          marginBottom: SIZES.margin
        }}>
          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
            ⏱️ Estimated Duration: {formData.estimated_hours} hours
          </Text>
        </View>
      )}

      {/* Location */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>City *</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin,
          fontSize: SIZES.medium
        }}
        placeholder="e.g., East London"
        value={formData.job_city}
        onChangeText={(text) => setFormData({ ...formData, job_city: text })}
      />

      {/* Full Address */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Full Address (Optional)</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          marginBottom: SIZES.margin * 2,
          fontSize: SIZES.medium
        }}
        placeholder="Full address will be shared privately after hire"
        value={formData.full_address}
        onChangeText={(text) => setFormData({ ...formData, full_address: text })}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          alignItems: 'center',
          opacity: loading ? 0.6 : 1
        }}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          {loading ? 'Posting...' : 'Post Job'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: SIZES.margin, textAlign: 'center' }}>
        * Required fields
      </Text>
    </ScrollView>
  );
};

export default PostJobScreen;
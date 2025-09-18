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

const PostJobScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userCity, setUserCity] = useState('');
  
  // Check if we're editing an existing job
  const jobToEdit = route.params?.job;
  const isEditing = Boolean(jobToEdit);
  
  // If editing, check if job already has a hired worker
  const canEdit = !isEditing || (isEditing && !jobToEdit.hired_worker_id);

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

  // Pre-fill form if editing an existing job
  useEffect(() => {
    if (isEditing && jobToEdit) {
      setFormData({
        title: jobToEdit.title || '',
        category: jobToEdit.category || '',
        description: jobToEdit.description || '',
        proposed_wage: jobToEdit.proposed_wage?.toString() || '',
        job_city: jobToEdit.job_city || '',
        full_address: jobToEdit.full_address || '',
        job_date: jobToEdit.job_date ? new Date(jobToEdit.job_date) : null,
        start_time: jobToEdit.start_time ? new Date(`1970-01-01T${jobToEdit.start_time}`) : null,
        end_time: jobToEdit.end_time ? new Date(`1970-01-01T${jobToEdit.end_time}`) : null,
        estimated_hours: jobToEdit.estimated_hours || 0
      });
    }
  }, [isEditing, jobToEdit]);

  // Fetch user's city from profile (only for new jobs)
  useEffect(() => {
    const fetchUserCity = async () => {
      if (user && !isEditing) {
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
  }, [user, isEditing]);

  // Calculate hours between start and end time
  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const diffMs = end.getTime() - start.getTime();
    return (diffMs / (1000 * 60 * 60)).toFixed(1);
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      Alert.alert('Cannot Edit', 'This job cannot be edited because a worker has already been hired.');
      return;
    }

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
      
      const jobData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        proposed_wage: parseFloat(formData.proposed_wage),
        job_city: formData.job_city,
        full_address: formData.full_address,
        job_date: formData.job_date?.toISOString().split('T')[0],
        start_time: formData.start_time?.toTimeString().split(' ')[0],
        end_time: formData.end_time?.toTimeString().split(' ')[0],
        estimated_hours: parseFloat(formData.estimated_hours),
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        // UPDATE existing job
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', jobToEdit.id);

        if (error) throw error;
        Alert.alert('Success', 'Job updated successfully!');
      } else {
        // CREATE new job
        jobData.employer_id = user.id;
        jobData.status = 'active';
        
        const { error } = await supabase
          .from('jobs')
          .insert([jobData]);

        if (error) throw error;
        Alert.alert('Success', 'Job posted successfully!');
      }

      // Clear form and navigate back
      if (!isEditing) {
        setFormData({
          title: '',
          category: '',
          description: '',
          proposed_wage: '',
          job_city: userCity,
          full_address: '',
          job_date: null,
          start_time: null,
          end_time: null,
          estimated_hours: 0
        });
      }

      // Navigate back to Home with refresh flag
      navigation.navigate('MainTabs', { 
  screen: 'Home',
  params: { shouldRefreshJobs: true }
});
      
    } catch (error) {
      console.error('Error saving job:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'post'} job: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit && isEditing) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.screenHeader}>Cannot Edit Job</Text>
        <Text style={{ textAlign: 'center', color: COLORS.gray700, marginTop: 20 }}>
          This job cannot be edited because a worker has already been hired.
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 30 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={globalStyles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>
        {isEditing ? 'Edit Job' : 'Post a New Job'}
      </Text>

      {/* Job Title */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Job Title *</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g., Garden cleanup, House cleaning, Furniture moving"
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
        editable={canEdit}
      />

      {/* Category */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Category *</Text>
      <View style={[globalStyles.input, { padding: 0 }]}>
        <Picker
          selectedValue={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          enabled={canEdit}
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
        style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Describe the job, required skills, tools needed, etc."
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
        editable={canEdit}
      />

      {/* Proposed Wage */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Proposed Wage (ZAR) *</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g., 250"
        keyboardType="numeric"
        value={formData.proposed_wage}
        onChangeText={(text) => setFormData({ ...formData, proposed_wage: text })}
        editable={canEdit}
      />

      {/* Job Date */}
      <CustomDateTimePicker
        label="Job Date *"
        value={formData.job_date}
        onChange={(date) => setFormData({ ...formData, job_date: date })}
        mode="date"
        minimumDate={new Date()}
        editable={canEdit}
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
        editable={canEdit}
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
        editable={canEdit}
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
        style={globalStyles.input}
        placeholder="e.g., East London"
        value={formData.job_city}
        onChangeText={(text) => setFormData({ ...formData, job_city: text })}
        editable={canEdit}
      />

      {/* Full Address */}
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Full Address (Optional)</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Full address will be shared privately after hire"
        value={formData.full_address}
        onChangeText={(text) => setFormData({ ...formData, full_address: text })}
        editable={canEdit}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[globalStyles.button, loading && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={globalStyles.buttonText}>
          {loading ? 'Please Wait...' : (isEditing ? 'Update Job' : 'Post Job')}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: SIZES.margin, textAlign: 'center' }}>
        * Required fields
      </Text>
    </ScrollView>
  );
};

export default PostJobScreen;
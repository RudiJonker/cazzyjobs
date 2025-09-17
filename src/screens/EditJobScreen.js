// src/screens/EditJobScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';

const EditJobScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const [loading, setLoading] = useState(false);
  
  // Form state - prefill with existing job data, ensure no undefined values
  const [title, setTitle] = useState(job.title || '');
  const [description, setDescription] = useState(job.description || '');
  const [category, setCategory] = useState(job.category || '');
  const [proposedWage, setProposedWage] = useState(job.proposed_wage?.toString() || '');
  const [jobDate, setJobDate] = useState(job.job_date || null);
  const [startTime, setStartTime] = useState(job.start_time || null);
  const [endTime, setEndTime] = useState(job.end_time || null);
  const [estimatedHours, setEstimatedHours] = useState(job.estimated_hours?.toString() || '');

  const handleUpdateJob = async () => {
    if (!title || !category || !proposedWage) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title,
        description,
        category,
        proposed_wage: parseFloat(proposedWage),
        updated_at: new Date().toISOString()
      };

      // Only include date/time fields if they have values
      if (jobDate) updateData.job_date = jobDate;
      if (startTime) updateData.start_time = startTime;
      if (endTime) updateData.end_time = endTime;
      if (estimatedHours) updateData.estimated_hours = parseFloat(estimatedHours);

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', job.id);

      if (error) throw error;

      Alert.alert('Success', 'Job updated successfully!');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error updating job:', error);
      Alert.alert('Error', 'Failed to update job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simple date input without DateTimePicker for now
  const renderDateInput = (label, value, onChange, placeholder) => (
    <>
      <Text style={globalStyles.label}>{label}</Text>
      <TextInput
        style={globalStyles.input}
        placeholder={placeholder}
        value={value || ''}
        onChangeText={onChange}
      />
    </>
  );

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>Edit Job</Text>

      {/* Title */}
      <Text style={globalStyles.label}>Job Title *</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g., Garden cleaning, Moving help"
        value={title}
        onChangeText={setTitle}
      />

      {/* Category */}
      <Text style={globalStyles.label}>Category *</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g., Gardening, Cleaning, Moving"
        value={category}
        onChangeText={setCategory}
      />

      {/* Wage */}
      <Text style={globalStyles.label}>Proposed Wage (ZAR) *</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g., 200"
        keyboardType="numeric"
        value={proposedWage}
        onChangeText={setProposedWage}
      />

      {/* Description */}
      <Text style={globalStyles.label}>Description</Text>
      <TextInput
        style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Describe the job in detail..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Simple text inputs for date/time instead of DateTimePicker */}
      {renderDateInput('Job Date (YYYY-MM-DD)', jobDate, setJobDate, '2025-09-20')}
      {renderDateInput('Start Time (HH:MM)', startTime, setStartTime, '14:00')}
      {renderDateInput('End Time (HH:MM)', endTime, setEndTime, '16:00')}

      {/* Estimated Hours */}
      <Text style={globalStyles.label}>Estimated Hours</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g., 2.5"
        keyboardType="numeric"
        value={estimatedHours}
        onChangeText={setEstimatedHours}
      />

      {/* Update Button */}
      <TouchableOpacity
        style={[globalStyles.button, { opacity: loading ? 0.6 : 1 }]}
        onPress={handleUpdateJob}
        disabled={loading}
      >
        <Text style={globalStyles.buttonText}>
          {loading ? 'Updating...' : 'Update Job'}
        </Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={{
          padding: SIZES.padding,
          alignItems: 'center',
          marginTop: SIZES.margin
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: COLORS.gray500 }}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditJobScreen;
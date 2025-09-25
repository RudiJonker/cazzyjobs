// src/screens/JobDetailScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { useApplications } from '../hooks/useApplications';

const JobDetailScreen = ({ route, navigation }) => {
  const { job } = route.params || {};
  const { applyToJob, loading, error } = useApplications();

  // Safe access to job properties with fallbacks
  const title = job?.title || 'Untitled Job';
  const wage = job?.proposed_wage || 0;
  const category = job?.category || 'Unknown Category';
  const city = job?.job_city || 'Location not specified';
  const description = job?.description || 'No description provided.';
  const jobDate = job?.job_date || null;
  const startTime = job?.start_time || null;
  const endTime = job?.end_time || null;
  const estimatedHours = job?.estimated_hours || 0;
  const createdAt = job?.created_at ? new Date(job.created_at) : new Date();

  // Format date (e.g., "Tuesday, 2 March") - YEAR REMOVED
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Format time (e.g., "10:00" to "10:00")
  const formatTime = (timeString) => {
    if (!timeString) return 'Time not specified';
    return timeString.slice(0, 5); // Get HH:MM from HH:MM:SS
  };

  // Format duration (e.g., "2 Hours")
  const formatDuration = (hours) => {
    if (!hours || hours === 0) return 'Duration not specified';
    if (hours === 1) return '1 Hour';
    return `${hours} Hours`;
  };

  // Format posted time (e.g., "2 hours ago")
  const formatPostedTime = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  const handleApply = async () => {
    if (!job?.id) {
      Alert.alert('Error', 'Cannot apply - job information is missing');
      return;
    }

    const result = await applyToJob(job.id);
    
    if (result.success) {
      Alert.alert(
        'Application Sent!',
        `✅ Your application for "${title}" has been sent.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Application Failed', `❌ ${result.error}`);
    }
  };

  if (!job) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.error, marginBottom: 10 }}>Job information not available</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      {/* Ad Banner */}
      <View style={{
        backgroundColor: '#f0f0f0',
        padding: SIZES.padding * 1.5,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray300,
        borderStyle: 'dashed',
        minHeight: 80,
        justifyContent: 'center'
      }}>
        <Text style={{ color: COLORS.gray500, fontWeight: '600', fontSize: SIZES.medium }}>
          🎯 Ad Banner Space (320×50)
        </Text>
        <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: 5 }}>
          Static advertisement will appear here
        </Text>
      </View>

      {/* Job Header */}
      <View style={{ marginBottom: SIZES.margin * 2 }}>
        <Text style={{ fontSize: SIZES.xxLarge, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 10 }}>
          {title}
        </Text>
        <Text style={{ fontSize: SIZES.xLarge, color: COLORS.primary, fontWeight: '600' }}>
          R{wage} • {category}
        </Text>
      </View>

      {/* Schedule Information */}
      {(jobDate || startTime || endTime || estimatedHours) && (
        <View style={{ backgroundColor: COLORS.white, padding: SIZES.padding, borderRadius: SIZES.radius, marginBottom: SIZES.margin, borderWidth: 1, borderColor: COLORS.gray200 }}>
          <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: 15, color: COLORS.gray900 }}>
            📅 Schedule
          </Text>
          
          {jobDate && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: COLORS.gray700 }}>Date</Text>
              <Text style={{ fontWeight: '600' }}>{formatDate(jobDate)}</Text>
            </View>
          )}
          
          {startTime && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: COLORS.gray700 }}>From</Text>
              <Text style={{ fontWeight: '600' }}>{formatTime(startTime)}</Text>
            </View>
          )}
          
          {endTime && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: COLORS.gray700 }}>To</Text>
              <Text style={{ fontWeight: '600' }}>{formatTime(endTime)}</Text>
            </View>
          )}
          
          {estimatedHours > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: COLORS.gray700 }}>Duration</Text>
              <Text style={{ fontWeight: '600' }}>{formatDuration(estimatedHours)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Job Meta Information */}
      <View style={{ backgroundColor: COLORS.gray100, padding: SIZES.padding, borderRadius: SIZES.radius, marginBottom: SIZES.margin * 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: COLORS.gray700 }}>📍 Location</Text>
          <Text style={{ fontWeight: '600' }}>{city}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: COLORS.gray700 }}>📁 Category</Text>
          <Text style={{ fontWeight: '600' }}>{category}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.gray700 }}>🕒 Posted</Text>
          <Text style={{ fontWeight: '600' }}>{formatPostedTime(createdAt)}</Text>
        </View>
      </View>

      {/* Job Description */}
      <View style={{ marginBottom: SIZES.margin * 2 }}>
        <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: 10, color: COLORS.gray900 }}>
          Job Description
        </Text>
        <Text style={{ color: COLORS.gray700, lineHeight: 20 }}>{description}</Text>
      </View>

      {/* Apply Button - Only show if job is active and not hired */}
      {job.status === 'active' && !job.hired_worker_id && (
        <TouchableOpacity
          style={{ backgroundColor: COLORS.primary, padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center', marginBottom: SIZES.margin * 2, opacity: loading ? 0.6 : 1 }}
          onPress={handleApply}
          disabled={loading}
        >
          <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
            {loading ? 'Applying...' : 'I\'m Interested!'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Job Status Info */}
      {job.status !== 'active' && (
        <View style={{ backgroundColor: COLORS.gray100, padding: SIZES.padding, borderRadius: SIZES.radius, marginBottom: SIZES.margin * 2 }}>
          <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: 10, color: COLORS.gray900 }}>
            Job Status
          </Text>
          <Text style={{ color: COLORS.gray700 }}>
            This job is {job.status}. {job.hired_worker_id ? 'A worker has been hired for this position.' : 'It is no longer accepting applications.'}
          </Text>
        </View>
      )}

      {/* Employer Info */}
      <View style={{ backgroundColor: COLORS.gray100, padding: SIZES.padding, borderRadius: SIZES.radius }}>
        <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: 10, color: COLORS.gray900 }}>
          About the Employer
        </Text>
        <Text style={{ color: COLORS.gray700 }}>
          Employer information will be shown here once we build user profiles.
        </Text>
      </View>
    </ScrollView>
  );
};

export default JobDetailScreen;
// src/screens/JobDetailScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { useApplications } from '../hooks/useApplications';

const JobDetailScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const { applyToJob, loading, error } = useApplications();

  const handleApply = async () => {
    console.log("Applying for job:", job.id);
    
    const result = await applyToJob(job.id);
    
    if (result.success) {
      alert(`✅ Application sent for: ${job.title}\nThe employer will contact you if interested.`);
      navigation.goBack();
    } else {
      alert(`❌ Application failed: ${result.error}`);
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      {/* Ad Banner Placeholder */}
      <View style={{
        backgroundColor: '#f0f0f0',
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray300,
        borderStyle: 'dashed'
      }}>
        <Text style={{ color: COLORS.gray500, fontWeight: '600' }}>
          🎯 Ad Banner Space (320×50)
        </Text>
        <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: 5 }}>
          Static advertisement will appear here
        </Text>
      </View>

      {/* Job Header */}
      <View style={{ marginBottom: SIZES.margin * 2 }}>
        <Text style={{ fontSize: SIZES.xxLarge, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 10 }}>
          {job.title}
        </Text>
        <Text style={{ fontSize: SIZES.xLarge, color: COLORS.primary, fontWeight: '600' }}>
          R{job.proposed_wage}
        </Text>
      </View>

      {/* Job Meta Information */}
      <View style={{ 
        backgroundColor: COLORS.gray100, 
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin * 2
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: COLORS.gray700 }}>📍 Location</Text>
          <Text style={{ fontWeight: '600' }}>{job.job_city}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: COLORS.gray700 }}>📁 Category</Text>
          <Text style={{ fontWeight: '600' }}>{job.category}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.gray700 }}>🕒 Posted</Text>
          <Text style={{ fontWeight: '600' }}>2 hours ago</Text>
        </View>
      </View>

      {/* Job Description */}
      <View style={{ marginBottom: SIZES.margin * 2 }}>
        <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: 10, color: COLORS.gray900 }}>
          Job Description
        </Text>
        <Text style={{ color: COLORS.gray700, lineHeight: 20 }}>
          {job.description || 'No description provided.'}
        </Text>
      </View>

      {/* Apply Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          alignItems: 'center',
          marginBottom: SIZES.margin * 2,
          opacity: loading ? 0.6 : 1,
        }}
        onPress={handleApply}
        disabled={loading}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          {loading ? 'Applying...' : 'I\'m Interested!'}
        </Text>
      </TouchableOpacity>

      {/* Employer Info */}
      <View style={{ 
        backgroundColor: COLORS.gray100, 
        padding: SIZES.padding,
        borderRadius: SIZES.radius
      }}>
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
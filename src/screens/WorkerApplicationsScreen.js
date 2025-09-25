// src/screens/WorkerApplicationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const WorkerApplicationsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Not authenticated');

      console.log("Fetching applications for worker:", user.id);

      // CORRECTED QUERY - No comments in the SQL string!
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          hired_at,
          job_id,
          jobs:job_id (
            id,
            title,
            proposed_wage,
            category,
            job_city,
            status,
            employer_id,
            description,
            job_date,
            start_time,
            end_time,
            estimated_hours,
            created_at,
            profiles:employer_id (full_name)
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      console.log("Applications fetched:", applicationsData);
      setApplications(applicationsData || []);
      
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  // Get status display text and color
  const getStatusInfo = (applicationStatus, jobStatus) => {
    if (jobStatus === 'cancelled') {
      return { text: 'CANCELLED', color: COLORS.error, bgColor: '#FFEBEE' };
    }
    
    switch (applicationStatus) {
      case 'pending':
        return { text: 'PENDING', color: COLORS.gray700, bgColor: '#F5F5F5' };
      case 'hired':
        return { text: 'HIRED 🎉', color: COLORS.success, bgColor: '#E8F5E8' };
      case 'rejected':
        return { text: 'JOB FILLED', color: COLORS.gray500, bgColor: '#F5F5F5' };
      default:
        return { text: 'PENDING', color: COLORS.gray700, bgColor: '#F5F5F5' };
    }
  };

  // FIXED: Proper job object handling
  const handleJobPress = (application) => {
    if (application.jobs) {
      // Create a proper job object with all required fields
      const job = {
        ...application.jobs,
        id: application.jobs.id || application.job_id
      };
      navigation.navigate('JobDetail', { job });
    }
  };

  const handleChatPress = (application) => {
    if (application.status === 'hired') {
      navigation.navigate('Messages', { 
        applicationId: application.id,
        jobTitle: application.jobs?.title 
      });
    }
  };

  const renderApplication = ({ item }) => {
    const job = item.jobs;
    const statusInfo = getStatusInfo(item.status, job?.status);
    
    // Safe access to nested data
    const jobTitle = job?.title || 'Unknown Job';
    const jobWage = job?.proposed_wage || 0;
    const jobCategory = job?.category || 'Unknown';
    const jobCity = job?.job_city || 'Unknown Location';
    const employerName = job?.profiles?.full_name || 'Employer';

    return (
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.white,
          padding: SIZES.padding,
          borderRadius: SIZES.radius,
          marginBottom: SIZES.margin,
          borderWidth: 1,
          borderColor: COLORS.gray200,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
        onPress={() => handleJobPress(item)} // FIXED: Pass the entire application item
      >
        {/* Job Header */}
        <Text style={{ fontSize: SIZES.large, fontWeight: 'bold', marginBottom: 5, color: COLORS.gray900 }}>
          {jobTitle}
        </Text>
        
        {/* Job Details */}
        <Text style={{ color: COLORS.primary, fontWeight: '600', marginBottom: 5 }}>
          R{jobWage} • {jobCategory}
        </Text>
        
        <Text style={{ color: COLORS.gray600, marginBottom: 5 }}>
          📍 {jobCity} • 👤 {employerName}
        </Text>
        
        <Text style={{ color: COLORS.gray500, marginBottom: 10, fontSize: SIZES.small }}>
          📅 Applied: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        
        {/* Status Badge */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 5
        }}>
          <View style={{ 
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: statusInfo.bgColor,
            alignSelf: 'flex-start'
          }}>
            <Text style={{ 
              color: statusInfo.color, 
              fontSize: SIZES.small,
              fontWeight: '600'
            }}>
              {statusInfo.text}
            </Text>
          </View>
          
          {/* Chat button for hired jobs */}
          {item.status === 'hired' && (
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 5
              }}
              onPress={() => handleChatPress(item)}
            >
              <Text style={{ color: COLORS.white, fontSize: SIZES.small, fontWeight: '600' }}>
                💬 Chat
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Additional info for different statuses */}
        {item.status === 'hired' && item.hired_at && (
          <Text style={{ color: COLORS.success, fontSize: SIZES.small, marginTop: 5 }}>
            ✅ Hired on {new Date(item.hired_at).toLocaleDateString()}
          </Text>
        )}
        
        {job?.status === 'cancelled' && (
          <Text style={{ color: COLORS.error, fontSize: SIZES.small, marginTop: 5 }}>
            ℹ️ Job was cancelled by employer
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading your applications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.error, marginBottom: 10 }}>Error: {error}</Text>
        <TouchableOpacity 
          style={{ backgroundColor: COLORS.primary, padding: 10, borderRadius: 5 }}
          onPress={fetchApplications}
        >
          <Text style={{ color: COLORS.white }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>My Job Applications</Text>
      <Text style={{ color: COLORS.gray500, marginBottom: SIZES.margin, textAlign: 'center' }}>
        Track your job applications and status
      </Text>
      
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchApplications}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: COLORS.gray500, textAlign: 'center', marginBottom: 10, fontSize: SIZES.large }}>
              📋 No applications yet
            </Text>
            <Text style={{ color: COLORS.gray400, textAlign: 'center', marginBottom: 20, fontSize: SIZES.small }}>
              Apply to jobs from the Home screen to see them here!
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 }}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={{ color: COLORS.white, fontWeight: '600' }}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default WorkerApplicationsScreen;
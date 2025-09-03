// src/screens/EmployerApplicationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';

const EmployerApplicationsScreen = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log("Fetching applications for employer:", user.id);

    // First, get all job IDs for this employer
    const { data: employerJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('employer_id', user.id);

    if (jobsError) throw jobsError;

    // If employer has no jobs, return empty array
    if (!employerJobs || employerJobs.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // Extract just the job IDs for the next query
    const jobIds = employerJobs.map(job => job.id);

    // Now fetch applications for these job IDs
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        jobs:job_id (title, proposed_wage, category),
        workers:worker_id (email, full_name)
      `)
      .in('job_id', jobIds) // Use the array of job IDs
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
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      console.log("Updating application:", applicationId, "to:", newStatus);
      
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Refresh the list
      fetchApplications();
      alert(`Application ${newStatus} successfully!`);
      
    } catch (err) {
      console.error('Error updating application:', err);
      alert(`Update failed: ${err.message}`);
    }
  };

  const renderApplication = ({ item }) => {
  // Safe access to nested data - handle cases where profile might not exist
  const workerName = item.workers?.full_name || item.workers?.email || 'Unknown User';
  const jobTitle = item.jobs?.title || 'Unknown Job';
  const jobWage = item.jobs?.proposed_wage || 0;
  const jobCategory = item.jobs?.category || 'Unknown';

  return (
    <View style={{
      backgroundColor: COLORS.white,
      padding: SIZES.padding,
      borderRadius: SIZES.radius,
      marginBottom: SIZES.margin,
      borderWidth: 1,
      borderColor: COLORS.gray100
    }}>
      <Text style={{ fontSize: SIZES.large, fontWeight: 'bold', marginBottom: 5, color: COLORS.gray900 }}>
        {jobTitle}
      </Text>
      <Text style={{ color: COLORS.primary, fontWeight: '600', marginBottom: 5 }}>
        R{jobWage} • {jobCategory}
      </Text>
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>
        👤 Applicant: {workerName}
      </Text>
      <Text style={{ color: COLORS.gray500, marginBottom: 10, fontSize: SIZES.small }}>
        📅 Applied: {new Date(item.created_at).toLocaleDateString()}
      </Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ 
          color: item.status === 'pending' ? COLORS.gray700 : 
                 item.status === 'hired' ? COLORS.success : COLORS.error,
          fontWeight: '600'
        }}>
          Status: {item.status}
        </Text>
        
        {item.status === 'pending' && (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{ backgroundColor: COLORS.success, padding: 5, borderRadius: 5, marginRight: 5 }}
              onPress={() => handleUpdateStatus(item.id, 'hired')}
            >
              <Text style={{ color: COLORS.white, fontSize: SIZES.small }}>Hire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: COLORS.error, padding: 5, borderRadius: 5 }}
              onPress={() => handleUpdateStatus(item.id, 'rejected')}
            >
              <Text style={{ color: COLORS.white, fontSize: SIZES.small }}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading applications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Error: {error}</Text>
        <TouchableOpacity onPress={fetchApplications} style={{ marginTop: 10 }}>
          <Text style={{ color: COLORS.primary }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>Job Applications</Text>
      <Text style={{ color: COLORS.gray500, marginBottom: SIZES.margin }}>
        {applications.length} application(s) for your jobs
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
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Text style={{ color: COLORS.gray500 }}>No applications yet</Text>
            <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: 5 }}>
              Applications will appear here when workers apply to your jobs
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default EmployerApplicationsScreen;
// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import JobCard from '../components/JobCard';
import { useJobs } from '../hooks/useJobs';
import { useEmployerJobs } from '../hooks/useEmployerJobs';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // ← ADD THIS HOOK
  const [userCity, setUserCity] = useState('Loading...');
  const { jobs, loading, error, refetch } = useJobs();
  const { jobs: employerJobs, loading: employerLoading, error: employerError, refetch: refetchEmployerJobs } = useEmployerJobs();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [hiredApplications, setHiredApplications] = useState({});

  // Check for refresh parameter from PostJobScreen
  useEffect(() => {
    if (route.params?.shouldRefreshJobs) {
      console.log('Refreshing employer jobs after job post...');
      refetchEmployerJobs();
      // Clear the parameter to prevent endless refreshes
      navigation.setParams({ shouldRefreshJobs: false });
    }
  }, [route.params, refetchEmployerJobs, navigation]);

  // Fetch user role and city from profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_role, city')
            .eq('id', user.id)
            .single();
          
          if (!profileError) {
            setUserRole(profile?.user_role);
            setUserCity(profile?.city || 'Your area');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUserCity('Your area');
        } finally {
          setRoleLoading(false);
        }
      } else {
        setRoleLoading(false);
        setUserCity('Your area');
      }
    };
    
    fetchUserData();
  }, [user]);

  // Filter jobs by user's city
  useEffect(() => {
    if (jobs && userCity && userCity !== 'Loading...' && userCity !== 'Your area') {
      const jobsInCity = jobs.filter(job => 
        job.job_city && job.job_city.toLowerCase() === userCity.toLowerCase()
      );
      setFilteredJobs(jobsInCity);
    } else {
      setFilteredJobs(jobs || []);
    }
  }, [jobs, userCity]);

  // Fetch hired applications for each job - UPDATED TO USE isFocused
  const fetchHiredApplications = async () => {
    if (userRole === 'employer' && employerJobs.length > 0) {
      try {
        const jobIds = employerJobs.map(job => job.id);
        const { data: applications, error } = await supabase
          .from('applications')
          .select('job_id, status')
          .in('job_id', jobIds)
          .eq('status', 'hired');

        if (!error) {
          const hiredMap = {};
          applications.forEach(app => {
            hiredMap[app.job_id] = true;
          });
          setHiredApplications(hiredMap);
          console.log('Hired applications updated:', hiredMap);
        }
      } catch (err) {
        console.error('Error fetching hired applications:', err);
      }
    }
  };

  // Refresh hired applications when screen comes into focus
  useEffect(() => {
    if (isFocused && userRole === 'employer') {
      console.log('Home screen focused - refreshing hired applications');
      fetchHiredApplications();
    }
  }, [isFocused, userRole, employerJobs]);

  // Also refresh when employerJobs changes
  useEffect(() => {
    if (userRole === 'employer' && employerJobs.length > 0) {
      fetchHiredApplications();
    }
  }, [employerJobs, userRole]);

  const handleJobPress = (job) => {
    navigation.navigate('JobDetail', { job });
  };

  const handleEditJob = (job) => {
    navigation.navigate('PostJob', { job: job });
  };

  // NEW FUNCTION: Handle pre-hire cancellation
  const handlePreHireCancel = async (jobId, jobTitle) => {
    Alert.alert(
      'Cancel Job',
      `Are you sure you want to cancel "${jobTitle}"? Applicants will be notified.`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('jobs')
                .update({ status: 'cancelled' })
                .eq('id', jobId);
              
              if (error) throw error;
              
              refetchEmployerJobs(); // Refresh the list
              fetchHiredApplications(); // Refresh hired data
              Alert.alert('Success', 'Job cancelled! Applicants have been notified.');
            } catch (err) {
              console.error('Error cancelling job:', err);
              Alert.alert('Error', 'Failed to cancel job');
            }
          }
        }
      ]
    );
  };

  // Helper function to check if job has hired applications
  const hasHiredApplications = (jobId) => {
    return hiredApplications[jobId] === true;
  };

  // Show loading while detecting role
  if (roleLoading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // EMPLOYER VIEW - Show dashboard with posted jobs
  if (userRole === 'employer') {
    const totalJobs = employerJobs.length;
    const activeJobsCount = employerJobs.filter(job => job.status === 'active').length;
    const completedJobsCount = employerJobs.filter(job => job.status === 'completed').length;
    const cancelledJobsCount = employerJobs.filter(job => job.status === 'cancelled').length;

    return (
      <View style={globalStyles.container}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.margin }}>
          <Text style={{ fontSize: SIZES.xLarge, fontWeight: 'bold', color: COLORS.primary }}>cazzyjobs</Text>
          <View style={{ padding: 5, backgroundColor: COLORS.gray100, borderRadius: SIZES.radius }}>
            <Text style={{ color: COLORS.gray700, fontSize: SIZES.small }}>💼 Employer</Text>
          </View>
        </View>

        {/* Enhanced Compact Stats Section */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          marginBottom: SIZES.margin
        }}>
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: '#E3F2FD', 
            padding: 6,
            borderRadius: 8,
            flex: 1,
            marginRight: 3,
            minHeight: 50
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1976D2' }}>{totalJobs}</Text>
            <Text style={{ color: '#1976D2', fontSize: 9, fontWeight: '600' }}>TOTAL</Text>
          </View>
          
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: '#E8F5E8', 
            padding: 6,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 3,
            minHeight: 50
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#2E7D32' }}>{activeJobsCount}</Text>
            <Text style={{ color: '#2E7D32', fontSize: 9, fontWeight: '600' }}>ACTIVE</Text>
          </View>
          
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: '#FFF3E0', 
            padding: 6,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 3,
            minHeight: 50
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#EF6C00' }}>{completedJobsCount}</Text>
            <Text style={{ color: '#EF6C00', fontSize: 9, fontWeight: '600' }}>DONE</Text>
          </View>
          
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: '#FFEBEE', 
            padding: 6,
            borderRadius: 8,
            flex: 1,
            marginLeft: 3,
            minHeight: 50
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#C62828' }}>{cancelledJobsCount}</Text>
            <Text style={{ color: '#C62828', fontSize: 9, fontWeight: '600' }}>CANCEL</Text>
          </View>
        </View>

        {/* Ultra Compact Dual Button Row */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          marginBottom: SIZES.margin * 1.2
        }}>
          {/* Applications Button */}
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              padding: 10,
              borderRadius: SIZES.radius,
              alignItems: 'center',
              flex: 1,
              marginRight: 6
            }}
            onPress={() => navigation.navigate('EmployerApplications')}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: SIZES.small }}>
              📋 Applications
            </Text>
          </TouchableOpacity>

          {/* New Job Button */}
          <TouchableOpacity 
            style={{ 
              backgroundColor: COLORS.success, 
              padding: 10,
              borderRadius: SIZES.radius,
              alignItems: 'center',
              flex: 1,
              marginLeft: 6
            }}
            onPress={() => navigation.navigate('PostJob')}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: SIZES.small }}>➕ New Job</Text>
          </TouchableOpacity>
        </View>

        {/* Jobs List Header */}
        <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: 10, color: COLORS.gray700 }}>
          Your Jobs ({employerJobs.length})
        </Text>
        
        {/* Jobs List - Compact Cards */}
        {employerLoading ? (
          <Text style={{ color: COLORS.gray500, textAlign: 'center', padding: 20 }}>Loading your jobs...</Text>
        ) : employerError ? (
          <Text style={{ color: COLORS.error, textAlign: 'center', padding: 20 }}>Error loading jobs</Text>
        ) : employerJobs.length > 0 ? (
          <FlatList
            data={employerJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.white,
                  padding: 10,
                  borderRadius: SIZES.radius,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: COLORS.gray300,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={() => handleEditJob(item)}
              >
                {/* Job Header with Cancel Icon */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '600', fontSize: SIZES.medium, color: COLORS.gray900, flex: 1 }}>
                    {item.title}
                  </Text>
                  
                  {/* Cancel Icon - Only show for active jobs without hired workers */}
                  {item.status === 'active' && !hasHiredApplications(item.id) && (
                    <TouchableOpacity 
                      style={{ 
                        padding: 6,
                        borderRadius: 20,
                        backgroundColor: '#FFEBEE'
                      }}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePreHireCancel(item.id, item.title);
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>🚫</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={{ color: COLORS.primary, fontWeight: '600', marginBottom: 3 }}>
                  R{item.proposed_wage} • {item.category}
                </Text>
                <Text style={{ color: COLORS.gray600, marginBottom: 5, fontSize: SIZES.small }}>
                  📍 {item.job_city}
                </Text>
                
                {/* Status Badge */}
                <View style={{ 
                  alignSelf: 'flex-start',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 12,
                  backgroundColor: 
                    item.status === 'active' ? '#E8F5E8' : 
                    item.status === 'completed' ? '#FFF3E0' : '#FFEBEE',
                }}>
                  <Text style={{ 
                    fontSize: 10,
                    fontWeight: '600',
                    color: 
                      item.status === 'active' ? '#2E7D32' : 
                      item.status === 'completed' ? '#EF6C00' : '#C62828'
                  }}>
                    {item.status?.toUpperCase()}
                    {hasHiredApplications(item.id) && item.status === 'active' ? ' • HIRED' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl
                refreshing={employerLoading}
                onRefresh={() => {
                  refetchEmployerJobs();
                  fetchHiredApplications(); // Refresh hired data on pull-to-refresh
                }}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: COLORS.gray500, textAlign: 'center', marginBottom: 10, fontSize: SIZES.large }}>
              📋 No jobs yet
            </Text>
            <Text style={{ color: COLORS.gray400, textAlign: 'center', marginBottom: 20, fontSize: SIZES.small }}>
              Post your first job to get started!
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 }}
              onPress={() => navigation.navigate('PostJob')}
            >
              <Text style={{ color: COLORS.white, fontWeight: '600' }}>Create Your First Job</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // WORKER VIEW - Original jobs list
  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Error: {error}</Text>
        <TouchableOpacity onPress={refetch} style={{ marginTop: 10 }}>
          <Text style={{ color: COLORS.primary }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.margin }}>
        <Text style={{ fontSize: SIZES.xLarge, fontWeight: 'bold', color: COLORS.primary }}>cazzyjobs</Text>
        <View style={{ padding: 5, backgroundColor: COLORS.gray100, borderRadius: SIZES.radius }}>
          <Text style={{ color: COLORS.gray700, fontSize: SIZES.small }}>
            📍 {userCity}
          </Text>
        </View>
      </View>

      {/* Jobs in City Header */}
      <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: SIZES.margin, color: COLORS.gray700 }}>
        {filteredJobs.length > 0 ? `Jobs in ${userCity}` : `No jobs in ${userCity}`}
      </Text>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard 
            job={item} 
            onPress={() => handleJobPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Text style={{ color: COLORS.gray500, textAlign: 'center', marginBottom: 10 }}>
              No jobs found in {userCity}
            </Text>
            <Text style={{ color: COLORS.gray400, fontSize: SIZES.small, textAlign: 'center' }}>
              Check back later or try a different location
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;
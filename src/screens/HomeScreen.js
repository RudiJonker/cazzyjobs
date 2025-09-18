// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import JobCard from '../components/JobCard';
import { useJobs } from '../hooks/useJobs';
import { useEmployerJobs } from '../hooks/useEmployerJobs';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const [userCity, setUserCity] = useState('Loading...');
  const { jobs, loading, error, refetch } = useJobs();
  const { jobs: employerJobs, loading: employerLoading, error: employerError, refetch: refetchEmployerJobs } = useEmployerJobs();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);

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

  const handleJobPress = (job) => {
    navigation.navigate('JobDetail', { job });
  };

  const handleEditJob = (job) => {
    navigation.navigate('EditJob', { job });
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
    return (
      <View style={globalStyles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.margin }}>
          <Text style={{ fontSize: SIZES.xLarge, fontWeight: 'bold', color: COLORS.primary }}>cazzyjobs</Text>
          <View style={{ padding: 5, backgroundColor: COLORS.gray100, borderRadius: SIZES.radius }}>
            <Text style={{ color: COLORS.gray700, fontSize: SIZES.small }}>💼 Employer</Text>
          </View>
        </View>

        <Text style={globalStyles.screenHeader}>Your Dashboard</Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.success,
            padding: SIZES.padding,
            borderRadius: SIZES.radius,
            alignItems: 'center',
            marginBottom: SIZES.margin * 2
          }}
          onPress={() => navigation.navigate('EmployerApplications')}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600' }}>
            👥 View Applications
          </Text>
        </TouchableOpacity>

        {/* Posted Jobs List */}
        <Text style={{ fontSize: SIZES.large, fontWeight: '600', marginBottom: SIZES.margin, color: COLORS.gray700 }}>
          Your Posted Jobs
        </Text>
        
        {employerLoading ? (
          <Text style={{ color: COLORS.gray500, textAlign: 'center' }}>Loading your jobs...</Text>
        ) : employerError ? (
          <Text style={{ color: COLORS.error, textAlign: 'center' }}>Error loading jobs</Text>
        ) : employerJobs.length > 0 ? (
          <FlatList
            data={employerJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.white,
                  padding: SIZES.padding,
                  borderRadius: SIZES.radius,
                  marginBottom: SIZES.margin,
                  borderWidth: 1,
                  borderColor: COLORS.gray300
                }}
                onPress={() => handleEditJob(item)}
              >
                <Text style={{ fontWeight: '600', fontSize: SIZES.medium, marginBottom: 5 }}>
                  {item.title}
                </Text>
                <Text style={{ color: COLORS.gray600, marginBottom: 5 }}>
                  {item.category} • {item.job_city}
                </Text>
                <Text style={{ 
                  color: item.status === 'active' ? COLORS.success : 
                         item.status === 'filled' ? COLORS.primary : 
                         item.status === 'completed' ? COLORS.gray500 : COLORS.error,
                  fontSize: SIZES.small
                }}>
                  Status: {item.status?.toUpperCase() || 'ACTIVE'}
                </Text>
                {item.hired_worker_id && (
                  <Text style={{ color: COLORS.primary, fontSize: SIZES.small, marginTop: 5 }}>
                    ✅ Hired worker
                  </Text>
                )}
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl
                refreshing={employerLoading}
                onRefresh={refetchEmployerJobs}
              />
            }
          />
        ) : (
          <Text style={{ color: COLORS.gray500, textAlign: 'center', marginTop: SIZES.margin * 2 }}>
            You haven't posted any jobs yet.
          </Text>
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
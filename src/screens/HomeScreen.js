// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import JobCard from '../components/JobCard';
import { useJobs } from '../hooks/useJobs';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [userCity, setUserCity] = useState('Loading...');
  const { jobs, loading, error, refetch } = useJobs();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

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

  const handleJobPress = (job) => {
    navigation.navigate('JobDetail', { job });
  };

  // Show loading while detecting role
  if (roleLoading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // EMPLOYER VIEW - Show applications instead of jobs
  if (userRole === 'employer') {
    return (
      <View style={globalStyles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.margin }}>
          <Text style={{ fontSize: SIZES.xLarge, fontWeight: 'bold', color: COLORS.primary }}>cazzyjobs</Text>
          <View style={{ padding: 5, backgroundColor: COLORS.gray100, borderRadius: SIZES.radius }}>
            <Text style={{ color: COLORS.gray700, fontSize: SIZES.small }}>💼 Employer</Text>
          </View>
        </View>

        <Text style={globalStyles.screenHeader}>Your Job Applications</Text>
        <Text style={{ color: COLORS.gray500, marginBottom: SIZES.margin * 2, textAlign: 'center' }}>
          You're seeing this because you're registered as an employer.
          We'll build your dashboard here soon.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            padding: SIZES.padding,
            borderRadius: SIZES.radius,
            alignItems: 'center',
            marginBottom: SIZES.margin * 2
          }}
          onPress={() => navigation.navigate('EmployerApplications')}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600' }}>
            View Applications
          </Text>
        </TouchableOpacity>

        <Text style={{ color: COLORS.gray500, textAlign: 'center' }}>
          Eventually, this will show your posted jobs and application stats.
        </Text>
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

      {/* Search Bar */}
      <View style={{ 
        backgroundColor: COLORS.gray100, 
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin 
      }}>
        <Text style={{ color: COLORS.gray500 }}>🔍 Search for gardening, cleaning, building jobs...</Text>
      </View>

      {/* Jobs List */}
      <FlatList
        data={jobs}
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
            <Text style={{ color: COLORS.gray500 }}>No jobs found in {userCity}</Text>
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // ← Add this
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import JobCard from '../components/JobCard';
import { getCityFromDeviceLocation } from '../utils/location';
import { useJobs } from '../hooks/useJobs';

// Temporary mock data - we'll replace with real data later
const mockJobs = [
  {
    id: '1',
    title: 'Help move furniture',
    proposed_wage: 150,
    category: 'Moving',
    job_city: 'Pretoria',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2', 
    title: 'Garden cleaning and weeding',
    proposed_wage: 200,
    category: 'Gardening',
    job_city: 'Johannesburg',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'House cleaning for party',
    proposed_wage: 300,
    category: 'Cleaning',
    job_city: 'Cape Town',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Replace the entire HomeScreen component with this:
const HomeScreen = () => {
  const navigation = useNavigation(); // ← Add this line
  const [detectedCity, setDetectedCity] = useState(null);
  const { jobs, loading, error, refetch } = useJobs();

  useEffect(() => {
    const detectCity = async () => {
      const city = await getCityFromDeviceLocation();
      setDetectedCity(city);
    };
    detectCity();
  }, []);

  const handleJobPress = (job) => {
  navigation.navigate('JobDetail', { job }); // Pass the job object
};

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
            {detectedCity ? `📍 ${detectedCity}` : '🌤️ 24°C'}
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
            <Text style={{ color: COLORS.gray500 }}>No jobs found in your area</Text>
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;
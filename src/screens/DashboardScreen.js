import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions, Easing, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function DashboardScreen({ route, navigation }) {
  const [role, setRole] = useState(route.params?.role || '');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const scrollX = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const textWidth = Dimensions.get('window').width * 3.5;

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError?.message);
        navigation.navigate('Login');
        return;
      }
      setUser(user);
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_users_id', user.id)
        .single();
      if (error) {
        console.error('Fetch role error:', error.message);
        setRole(route.params?.role || 'employer');
      } else {
        setRole(data.role);
      }
      setLoading(false);
    };
    fetchRole();
  }, [route.params?.role, navigation]);

  useEffect(() => {
    const duration = 25000;
    const animate = () => {
      scrollX.setValue(Dimensions.get('window').width);
      Animated.timing(scrollX, {
        toValue: -textWidth,
        duration,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => animate());
    };
    animate();
  }, [scrollX, textWidth]);

  const jobSeekerBannerText = 'You are in the Top 10% of job Seekers in your community with 247 points - keep up the good work! ...... 123623 IzziJobs Users worldwide and growing!';
  const employerBannerText = 'You are managing top jobs in your community with 150 points - keep it up! ...... 123623 IzziJobs Users worldwide and growing!';

  const jobSeekerCards = [
    { id: 'rank', title: 'Rank', icon: 'crown', color: '#333', onPress: () => {} },
    { id: 'rating', title: 'Rating', icon: 'star', color: '#ff9800', onPress: () => navigation.navigate('RatingScreen') },
    { id: 'weather', title: 'Weather', icon: 'weather-partly-cloudy', color: '#ffeb3b', onPress: () => navigation.navigate('WeatherScreen') },
    { id: 'calendar', title: 'Calendar', icon: 'calendar', color: '#4caf50', onPress: () => navigation.navigate('CalendarScreen') },
    { id: 'unread', title: 'Unread: 2', icon: 'chat', color: '#007bff', onPress: () => {} },
    { id: 'statement', title: '2513', icon: 'bank', color: '#6a1b9a', onPress: () => navigation.navigate('EarningsStatementScreen') },
    { id: 'jobs', title: 'Jobs', icon: 'briefcase', color: '#ff4500', onPress: () => navigation.navigate('ListOfJobsScreen') },
    { id: 'applied', title: 'Applied', icon: 'file-document', color: '#48d22b', onPress: () => navigation.navigate('AppliedJobsScreen') },
  ];

  const employerCards = [
    { id: 'weather', title: 'Weather', icon: 'weather-partly-cloudy', color: '#ffeb3b', onPress: () => navigation.navigate('WeatherScreen') },
    { id: 'calendar', title: 'Calendar', icon: 'calendar', color: '#4caf50', onPress: () => navigation.navigate('CalendarScreen') },
    { id: 'unread', title: 'Unread: 2', icon: 'chat', color: '#007bff', onPress: () => {} },
    { id: 'rating', title: 'Rating', icon: 'star', color: '#ff9800', onPress: () => navigation.navigate('RatingScreen') },
    { id: 'newJob', title: 'New Job', icon: 'briefcase', color: '#48d22b', onPress: () => navigation.navigate('PostingJobsScreen', { userId: user?.id }) },
    { id: 'myJobs', title: 'My Jobs', icon: 'briefcase-check', color: '#2196f3', onPress: () => navigation.navigate('MyJobPosts', { userId: user?.id }) },
    { id: 'applicants', title: 'Applicants', icon: 'account-group', color: '#ff4500', onPress: () => navigation.navigate('ApplicantsScreen') },
    { id: 'salaries', title: 'Salaries', icon: 'cash', color: '#6a1b9a', onPress: () => navigation.navigate('SalariesPaid') },
  ];

  const renderCard = ({ item }) => (
    <TouchableOpacity onPress={item.onPress} style={styles.cardContainer}>
      <View style={styles.card}>
        <MaterialCommunityIcons name={item.icon} size={35} color={item.color} style={styles.icon} />
        <Text style={styles.itemText}>{item.title}</Text>
        {item.id === 'rating' && (
          <View style={styles.starRating}>
            {Array(5).fill().map((_, i) => (
              <MaterialCommunityIcons key={i} name={i < 3 ? 'star' : 'star-outline'} size={15} color="#ff9800" />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Animated.View style={{ transform: [{ translateX: scrollX }], width: textWidth }}>
          <Text style={styles.bannerText} numberOfLines={1}>
            {role === 'job_seeker' ? jobSeekerBannerText : employerBannerText}
          </Text>
        </Animated.View>
      </View>
      <FlatList
        data={role === 'job_seeker' ? jobSeekerCards : employerCards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    height: 40,
    backgroundColor: '#48d22b',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    top: 10,
    left: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flatList: {
    flex: 1,
    marginTop: 50,
  },
  listContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 10, // Add this to control side margins
  },
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 100,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginBottom: 4,
  },
  itemText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#333',
  },
  starRating: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
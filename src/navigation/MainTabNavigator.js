import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PostJobScreen from '../screens/PostJobScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Simple Share Screen Component
const ShareScreen = () => {
  const handleShare = async () => {
    try {
      const shareMessage = "Check out CazzyJobs - the best app for finding local casual work! Download it today!";
      
      Alert.alert(
        'Share CazzyJobs',
        shareMessage,
        [
          {
            text: 'Copy Link',
            onPress: () => {
              Alert.alert('Copied!', 'Share message copied to clipboard.');
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20, color: COLORS.gray700 }}>
        Help spread the word about CazzyJobs!
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: 15,
          borderRadius: 10,
          width: '80%',
          alignItems: 'center',
        }}
        onPress={handleShare}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Share App</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function MainTabNavigator() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // FETCH USER ROLE FROM PROFILES TABLE
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
        } else if (data) {
          setUserRole(data.user_role);
          console.log('Fetched user role from profiles:', data.user_role);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('Current user role:', userRole);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Post') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Share') iconName = focused ? 'share-social' : 'share-social-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: true,
        headerTitleAlign: 'center',
      })}
    >
      {/* ALWAYS VISIBLE TABS */}
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      
      {/* ROLE-BASED TABS */}
      {userRole === 'worker' && (
        <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search Jobs' }} />
      )}
      
      {userRole === 'employer' && (
        <Tab.Screen name="Post" component={PostJobScreen} options={{ title: 'Post Job' }} />
      )}
      
      <Tab.Screen name="Messages" component={MessagesListScreen} options={{ title: 'Messages' }} />
      
      {/* NEW SHARE TAB */}
      <Tab.Screen 
        name="Share" 
        component={ShareScreen} 
        options={{ 
          title: 'Share',
        }} 
      />
      
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
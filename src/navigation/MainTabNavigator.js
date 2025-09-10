import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PostJobScreen from '../screens/PostJobScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
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

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: true,
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
          headerLeft: () => null, // Remove back button on home screen
        }} 
      />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search Jobs' }} />
      <Tab.Screen name="Post" component={PostJobScreen} options={{ title: 'Post Job' }} />
      <Tab.Screen 
        name="Messages" 
        component={MessagesListScreen} 
        options={{ title: 'Messages' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // This will trigger when the Messages tab is pressed
            // The useFocusEffect in MessagesListScreen will handle the refresh
          },
        })}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
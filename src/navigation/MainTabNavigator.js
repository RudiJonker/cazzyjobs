// src/navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';

// Import actual screens (not placeholders)
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PostJobScreen from '../screens/PostJobScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  // Use the notification hook to get the unread count
  const { unreadCount } = useNotifications();

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

          // For the Messages tab, we wrap the icon in a View to add the badge
          if (route.name === 'Messages') {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -10,
                      backgroundColor: 'red',
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          // For all other tabs, return the icon normally
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Post" component={PostJobScreen} />
      <Tab.Screen name="Messages" component={MessagesListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
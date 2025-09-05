// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Import Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import MainTabNavigator from './MainTabNavigator';
import JobDetailScreen from '../screens/JobDetailScreen';
import EmployerApplicationsScreen from '../screens/EmployerApplicationsScreen';
import PostJobScreen from '../screens/PostJobScreen';
import ChatScreen from '../screens/ChatScreen'; // <-- Add this import

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Welcome" 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        {/* Auth Flow Screens */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        
        {/* Main App Screens */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} 
          options={{ headerShown: true, title: 'Job Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen name="EmployerApplications" component={EmployerApplicationsScreen} 
          options={{ headerShown: true, title: 'Your Applications', headerBackTitle: 'Back' }}
        />
        <Stack.Screen name="PostJob" component={PostJobScreen} 
          options={{ headerShown: true, title: 'Post a New Job', headerBackTitle: 'Back' }}
        />
        {/* Add ChatScreen to main navigator */}
        <Stack.Screen name="Chat" component={ChatScreen} 
          options={{ headerShown: true, title: 'Chat', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import JobSeekerProfileScreen from '../screens/JobSeekerProfileScreen';
import EmployerProfileScreen from '../screens/EmployerProfileScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShareScreen from '../screens/ShareScreen';

const Stack = createNativeStackNavigator();
const Tab = createMaterialBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="Home"
    activeColor="#48d22b"
    inactiveColor="#333"
    barStyle={{ backgroundColor: '#f5f5f5', borderTopColor: '#ccc', borderTopWidth: 1 }}
  >
    <Tab.Screen
      name="Home"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="home" color={color} size={26} />
        ),
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        tabBarLabel: 'Chat',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="chat" color={color} size={26} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={route =>
        route.params?.userRole === 'employer'
          ? EmployerProfileScreen
          : JobSeekerProfileScreen
      }
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="account" color={color} size={26} />
        ),
      }}
      initialParams={{ userId: null, userRole: 'job_seeker' }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="cog" color={color} size={26} />
        ),
      }}
    />
    <Tab.Screen
      name="Share"
      component={ShareScreen}
      options={{
        tabBarLabel: 'Share',
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="share-variant" color={color} size={26} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef => { global.navigationRef = navigationRef; }}>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
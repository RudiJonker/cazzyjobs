// src/navigation/AppNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Import Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import MainTabNavigator from './MainTabNavigator';
import JobDetailScreen from '../screens/JobDetailScreen';
import EmployerApplicationsScreen from '../screens/EmployerApplicationsScreen';

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
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
        />
        
        {/* Main App Screens */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
        />
        <Stack.Screen 
          name="JobDetail" 
          component={JobDetailScreen} 
          options={{ 
            headerShown: true,
            title: 'Job Details',
            headerBackTitle: 'Back'
          }}
        />
        <Stack.Screen 
          name="EmployerApplications" 
          component={EmployerApplicationsScreen} 
          options={{ 
            headerShown: true,
            title: 'Your Applications',
            headerBackTitle: 'Back'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
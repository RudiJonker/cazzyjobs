import * as React from 'react';
  import { NavigationContainer } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';
  import WelcomeScreen from '../screens/WelcomeScreen';
  import SignupScreen from '../screens/SignupScreen';
  import LoginScreen from '../screens/LoginScreen';

  const Stack = createStackNavigator();

  export default function AppNavigator() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
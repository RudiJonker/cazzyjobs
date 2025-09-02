// App.js
import { StatusBar } from 'expo-status-bar';
import './src/lib/supabase'; // Initialize Supabase
import AppNavigator from './src/navigation/AppNavigator'; // Import our navigator

// Main App component - Now very simple!
export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
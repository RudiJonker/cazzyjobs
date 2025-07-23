import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/services/supabase';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setInitializing(false);

      if (session) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          const userRole = userData.role;
          if (userRole === 'job_seeker' || userRole === 'employer') {
            // Rely on AppNavigator to handle navigation
            // Navigation will be triggered after AppNavigator mounts
            setTimeout(() => {
              if (global.navigationRef?.current) {
                global.navigationRef.current.navigate('DashboardScreen', { userRole });
              }
            }, 0);
          }
        }
      }
    };

    checkSession();

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AppNavigator />;
}
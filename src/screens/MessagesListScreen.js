// src/screens/MessagesListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const MessagesListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      setLoading(true);
      if (!user) return;

      console.log('Fetching conversations for user:', user.id);

      // Fetch all hired applications where the user is involved
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          hired_at,
          worker_id,
          jobs:job_id (
            title, 
            employer_id,
            profiles:employer_id (
              full_name,
              email
            )
          ),
          workers:worker_id (
            full_name,
            email
          )
        `)
        .eq('status', 'hired')
        .order('hired_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      console.log('Raw applications data:', data);

      // Filter applications on the client side to only include those where user is involved
      const userConversations = data.filter(app => 
        app.worker_id === user.id || app.jobs?.employer_id === user.id
      );

      console.log('Filtered conversations:', userConversations);

      // Format the conversations with proper names
      const conversationsWithNames = userConversations.map((app) => {
        const isWorker = user.id === app.worker_id;
        
        // Get the other party's details
        let otherPartyName = 'Unknown';
        if (isWorker) {
          // Worker viewing → show employer's name
          otherPartyName = app.jobs?.profiles?.full_name || 
                          app.jobs?.profiles?.email || 
                          'Employer';
        } else {
          // Employer viewing → show worker's name
          otherPartyName = app.workers?.full_name || 
                          app.workers?.email || 
                          'Worker';
        }

        return {
          id: app.id,
          jobTitle: app.jobs?.title || 'Unknown Job',
          otherPartyName: otherPartyName,
          hiredAt: app.hired_at,
        };
      });

      console.log('Formatted conversations:', conversationsWithNames);
      setConversations(conversationsWithNames);
      
    } catch (err) {
      console.error('Error in fetchConversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        marginBottom: SIZES.margin,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.gray100,
      }}
      onPress={() => navigation.navigate('Chat', { applicationId: item.id })}
    >
      <Text style={{ fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.gray900 }}>
        {item.jobTitle}
      </Text>
      <Text style={{ color: COLORS.gray700, marginVertical: 4 }}>
        With: {item.otherPartyName}
      </Text>
      <Text style={{ color: COLORS.gray500, fontSize: SIZES.small }}>
        Hired on: {new Date(item.hiredAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.screenHeader}>Messages</Text>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchConversations} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ color: COLORS.gray500 }}>No active conversations</Text>
              <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: 5, textAlign: 'center' }}>
                You'll see your hired jobs here where you can chat with the other person.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default MessagesListScreen;
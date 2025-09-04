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

      // We need to use a more direct approach since complex OR conditions with nested fields are tricky
      // Let's fetch applications where the user is either the worker OR the employer
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          hired_at,
          worker_id,
          jobs:job_id (title, proposed_wage, category, employer_id)
        `)
        .eq('status', 'hired')
        .order('hired_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      // Filter applications on the client side to only include those where user is involved
      const userConversations = data.filter(app => 
        app.worker_id === user.id || app.jobs?.employer_id === user.id
      );

      // Now fetch profile names for the other parties
      const conversationsWithNames = await Promise.all(
        userConversations.map(async (app) => {
          const isWorker = user.id === app.worker_id;
          const otherPartyId = isWorker ? app.jobs?.employer_id : app.worker_id;
          
          let otherPartyName = 'Unknown';
          
          if (otherPartyId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', otherPartyId)
              .single();
            
            otherPartyName = profile?.full_name || (isWorker ? 'Employer' : 'Worker');
          }

          return {
            id: app.id,
            jobTitle: app.jobs?.title || 'Unknown Job',
            otherPartyName: otherPartyName,
            hiredAt: app.hired_at,
          };
        })
      );

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
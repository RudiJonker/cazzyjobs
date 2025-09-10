import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const MessagesListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { unreadCount, refreshing, refreshNotifications } = useNotifications();

  // Update header with badge and back button
  useEffect(() => {
  navigation.setOptions({
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Messages</Text>
        {unreadCount > 0 && (
          <View
            style={{
              backgroundColor: 'red',
              borderRadius: 10,
              width: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 8,
            }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={{ marginLeft: 15 }}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity 
        onPress={() => {
          refreshNotifications();
          fetchConversations();
        }} 
        style={{ marginRight: 15 }}
      >
        <Ionicons name="refresh" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    )
  });
}, [navigation, unreadCount]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          hired_at,
          worker_id,
          jobs:job_id (
            id,
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

      // Filter applications where user is involved
      const userConversations = data.filter(app => {
        const isWorker = user.id === app.worker_id;
        const isEmployer = user.id === app.jobs?.employer_id;
        return isWorker || isEmployer;
      });

      // Format the conversations
      const conversationsWithNames = userConversations.map((app) => {
        const isWorker = user.id === app.worker_id;
        
        let otherPartyName = 'Unknown';
        if (isWorker) {
          otherPartyName = app.jobs?.profiles?.full_name || 
                          app.jobs?.profiles?.email || 
                          'Employer';
        } else {
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

  // Remove automatic polling - only refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      if (isActive) {
        refreshNotifications();
        fetchConversations();
      }

      return () => {
        isActive = false;
      };
    }, [user])
  );

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
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl 
            refreshing={loading || refreshing}
            onRefresh={() => {
              refreshNotifications();
              fetchConversations();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
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
// src/screens/ChatScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const ChatScreen = ({ route, navigation }) => {
  const { applicationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherPartyName, setOtherPartyName] = useState('');

  // Fetch chat messages
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          read,
          sender_id,
          profiles:sender_id(full_name)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the other party's name and set screen title
  // Fetch the other party's name and set screen title
const fetchConversationDetails = async () => {
  try {
    // Check if user is available - ADD THIS NULL CHECK
    if (!user) {
      console.log('User not available yet');
      return;
    }

    // Get application details to find out who the other party is
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        worker_id,
        jobs:job_id(title, employer_id)
      `)
      .eq('id', applicationId)
      .single();

    if (error) throw error;

    const jobTitle = application.jobs?.title || 'Unknown Job';
    navigation.setOptions({ title: jobTitle });

    // Determine who the other party is
    const isWorker = user.id === application.worker_id; // Now user.id is safe
    const otherPartyId = isWorker ? application.jobs?.employer_id : application.worker_id;

    if (otherPartyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherPartyId)
        .single();
      
      setOtherPartyName(profile?.full_name || (isWorker ? 'Employer' : 'Worker'));
    }
  } catch (error) {
    console.error('Error fetching conversation details:', error);
  }
};

  // Send a new message
  const sendMessage = async () => {
  if (!newMessage.trim()) return;
  if (!user) { // Add null check
    Alert.alert('Error', 'You must be logged in to send messages');
    return;
  }

  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        application_id: applicationId,
        sender_id: user.id, // Now safe to access
        content: newMessage.trim(),
        read: false
      });

    if (error) throw error;

    setNewMessage(''); // Clear input field
  } catch (error) {
    console.error('Error sending message:', error);
    Alert.alert('Error', 'Failed to send message');
  }
};

  // Set up real-time subscription for new messages
  // Set up real-time subscription for new messages
useEffect(() => {
  if (!user) return; // Don't run until user is available

  fetchMessages();
  fetchConversationDetails();

  const subscription = supabase
    .channel('messages-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `application_id=eq.${applicationId}`
      },
      (payload) => {
        // When a new message is inserted, add it to our state
        setMessages(prev => [...prev, payload.new]);
      }
    )
    .subscribe();

  // Cleanup subscription on unmount
  return () => {
    subscription.unsubscribe();
  };
}, [applicationId, user]); // Add user to dependency array

  const renderMessage = ({ item }) => {
  const isMyMessage = item.sender_id === user?.id; // Add optional chaining
  
  return (
    <View style={{
      alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
      backgroundColor: isMyMessage ? COLORS.primary : COLORS.gray200,
      padding: SIZES.padding,
      borderRadius: SIZES.radius,
      marginBottom: SIZES.margin,
      maxWidth: '80%'
    }}>
      <Text style={{
        color: isMyMessage ? COLORS.white : COLORS.gray900,
        fontSize: SIZES.medium
      }}>
        {item.content}
      </Text>
      <Text style={{
        color: isMyMessage ? COLORS.white : COLORS.gray500,
        fontSize: SIZES.small,
        marginTop: 4,
        opacity: 0.7
      }}>
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );
};

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={[globalStyles.container, { paddingBottom: 0 }]}>
        <Text style={{ 
          textAlign: 'center', 
          color: COLORS.gray500, 
          marginBottom: SIZES.margin,
          fontStyle: 'italic'
        }}>
          Chat with {otherPartyName}
        </Text>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: SIZES.padding }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ color: COLORS.gray500 }}>No messages yet</Text>
              <Text style={{ color: COLORS.gray500, fontSize: SIZES.small, marginTop: 5, textAlign: 'center' }}>
                Start the conversation by sending a message below.
              </Text>
            </View>
          }
        />

        <View style={{
          flexDirection: 'row',
          padding: SIZES.padding,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray200,
          backgroundColor: COLORS.white
        }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.gray300,
              borderRadius: SIZES.radius,
              padding: SIZES.padding,
              marginRight: SIZES.margin
            }}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              padding: SIZES.padding,
              borderRadius: SIZES.radius,
              justifyContent: 'center'
            }}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
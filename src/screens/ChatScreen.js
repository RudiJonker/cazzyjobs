// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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
  const hasMarkedAsRead = useRef(false); // To prevent infinite loops

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
  const fetchConversationDetails = async () => {
    try {
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
      const isWorker = user.id === application.worker_id;
      const otherPartyId = isWorker ? application.jobs?.employer_id : application.worker_id;

      if (otherPartyId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', otherPartyId)
          .single();
        
        setOtherPartyName(profile?.full_name || profile?.email || (isWorker ? 'Employer' : 'Worker'));
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  // Mark MESSAGES as read for this chat (CORRECTED FUNCTION)
  const markMessagesAsRead = async () => {
    try {
      if (!user || hasMarkedAsRead.current) return;
      
      console.log('Marking messages as read in chat:', applicationId);
      hasMarkedAsRead.current = true; // Prevent multiple calls
      
      // Mark all messages in this chat that aren't sent by the user as read
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('application_id', applicationId)
        .eq('read', false)
        .neq('sender_id', user.id); // Only mark messages from others as read

      if (error) {
        console.error('Error marking messages as read:', error);
        hasMarkedAsRead.current = false; // Reset on error
      } else {
        console.log('Messages marked as read for application:', applicationId);
        // Don't reset hasMarkedAsRead - we only want to do this once per chat session
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      hasMarkedAsRead.current = false; // Reset on error
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    try {
      // First, get application details to find the other party
      const { data: application } = await supabase
        .from('applications')
        .select('worker_id, jobs(employer_id)')
        .eq('id', applicationId)
        .single();

      if (!application) throw new Error('Application not found');

      // Determine who the recipient is (the other party)
      const isWorker = user.id === application.worker_id;
      const recipientId = isWorker ? application.jobs.employer_id : application.worker_id;

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          application_id: applicationId,
          sender_id: user.id,
          content: newMessage.trim(),
          read: false
        });

      if (messageError) throw messageError;

      // Create notification for the recipient
      const { error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: recipientId,
        p_title: 'New Message 💬',
        p_body: `You have a new message about a job.`,
        p_type: 'message',
        p_related_id: applicationId
      });

      if (notifError) console.error('Notification error:', notifError);

      setNewMessage(''); // Clear input field
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    fetchMessages();
    fetchConversationDetails();

    // Set up subscription first, then mark as read
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

    // Mark messages as read after a short delay to ensure subscription is active
    const markReadTimer = setTimeout(() => {
      markMessagesAsRead();
    }, 1000);

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(markReadTimer);
      subscription.unsubscribe();
      hasMarkedAsRead.current = false; // Reset for next time
    };
  }, [applicationId, user]);

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user?.id;
    
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
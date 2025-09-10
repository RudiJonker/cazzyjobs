import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const ChatScreen = ({ route, navigation }) => {
  const { applicationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherPartyName, setOtherPartyName] = useState('');
  const hasMarkedAsRead = useRef(false);
  
  const { refreshNotifications } = useNotifications();

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

  // Mark messages as read - SIMPLIFIED
  const markMessagesAsRead = async () => {
    try {
      if (!user || hasMarkedAsRead.current) return;
      
      console.log('Marking messages as read in chat:', applicationId);
      hasMarkedAsRead.current = true;
      
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('application_id', applicationId)
        .eq('read', false)
        .neq('sender_id', user.id);

      if (error) {
        console.error('Error marking messages as read:', error);
        hasMarkedAsRead.current = false;
        return;
      }

      console.log('All messages marked as read');
      
      // IMMEDIATELY refresh notifications after marking as read
      refreshNotifications();
      
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      hasMarkedAsRead.current = false;
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
      const { data: application } = await supabase
        .from('applications')
        .select('worker_id, jobs(employer_id)')
        .eq('id', applicationId)
        .single();

      if (!application) throw new Error('Application not found');

      const isWorker = user.id === application.worker_id;
      const recipientId = isWorker ? application.jobs.employer_id : application.worker_id;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          application_id: applicationId,
          sender_id: user.id,
          content: newMessage.trim(),
          read: false
        });

      if (messageError) throw messageError;

      const { error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: recipientId,
        p_title: 'New Message 💬',
        p_body: `You have a new message about a job.`,
        p_type: 'message',
        p_related_id: applicationId
      });

      if (notifError) console.error('Notification error:', notifError);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Set up real-time subscription ONLY for new messages in this chat
  useEffect(() => {
    if (!user) return;

    fetchMessages();
    fetchConversationDetails();

    // Simple subscription only for new messages in this chat
    const subscription = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Mark messages as read after a short delay
    const markReadTimer = setTimeout(() => {
      markMessagesAsRead();
    }, 500); // Reduced from 1000ms to 500ms

    // Cleanup
    return () => {
      clearTimeout(markReadTimer);
      subscription.unsubscribe();
      hasMarkedAsRead.current = false;
      
      // Refresh notifications when leaving chat
      refreshNotifications();
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
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
  const [sending, setSending] = useState(false); // Add sending state
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

  // Send a new message with OPTIMISTIC UI UPDATE
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    setSending(true);
    const messageContent = newMessage.trim();
    let tempMessageId = null;

    try {
      // 1. OPTIMISTIC UI UPDATE: Add message to UI immediately
      tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage = {
        id: tempMessageId,
        content: messageContent,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        read: false,
        application_id: applicationId,
        // Add profile info for display
        profiles: {
          full_name: user.user_metadata?.full_name || 'You'
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage(''); // Clear input immediately

      // 2. Send to Supabase
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('worker_id, jobs(employer_id)')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;
      if (!application) throw new Error('Application not found');

      const isWorker = user.id === application.worker_id;
      const recipientId = isWorker ? application.jobs.employer_id : application.worker_id;

      // 3. Insert into database
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          application_id: applicationId,
          sender_id: user.id,
          content: messageContent,
          read: false
        });

      if (messageError) throw messageError;

      // 4. Send notification
      const { error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: recipientId,
        p_title: 'New Message 💬',
        p_body: `You have a new message about a job.`,
        p_type: 'message',
        p_related_id: applicationId
      });

      if (notifError) console.error('Notification error:', notifError);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // 5. REVERT OPTIMISTIC UPDATE on error
      if (tempMessageId) {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      }
      
      setNewMessage(messageContent); // Restore the message
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
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
          // Check if this is a duplicate (already added via optimistic update)
          const isDuplicate = messages.some(msg => 
            msg.id === payload.new.id || 
            msg.id.startsWith('temp-') && 
            msg.content === payload.new.content &&
            msg.sender_id === payload.new.sender_id
          );
          
          if (!isDuplicate) {
            setMessages(prev => [...prev, {
              ...payload.new,
              profiles: { full_name: 'Other user' } // Temporary until we fetch proper profile
            }]);
          }
        }
      )
      .subscribe();

    // Mark messages as read after a short delay
    const markReadTimer = setTimeout(() => {
      markMessagesAsRead();
    }, 500);

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
    const displayName = item.profiles?.full_name || (isMyMessage ? 'You' : 'Other user');
    
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
          {item.id.startsWith('temp-') && ' • Sending...'}
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
            editable={!sending}
          />
          <TouchableOpacity
            style={{
              backgroundColor: sending ? COLORS.gray300 : COLORS.primary,
              padding: SIZES.padding,
              borderRadius: SIZES.radius,
              justifyContent: 'center',
              opacity: sending ? 0.7 : 1
            }}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>
              {sending ? '...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
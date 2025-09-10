import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route, navigation }) => {
  const { applicationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherPartyName, setOtherPartyName] = useState('');
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const flatListRef = useRef(null);
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
      
      setTimeout(() => {
        if (flatListRef.current && data.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
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

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      if (!user || hasMarkedAsRead.current) return;
      
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
      // OPTIMISTIC UI UPDATE
      tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage = {
        id: tempMessageId,
        content: messageContent,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        read: false,
        application_id: applicationId,
        profiles: {
          full_name: user.user_metadata?.full_name || 'You'
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setInputHeight(40);

      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }

      // Send to Supabase
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('worker_id, jobs(employer_id)')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;
      if (!application) throw new Error('Application not found');

      const isWorker = user.id === application.worker_id;
      const recipientId = isWorker ? application.jobs.employer_id : application.worker_id;

      // Insert into database
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          application_id: applicationId,
          sender_id: user.id,
          content: messageContent,
          read: false
        });

      if (messageError) throw messageError;

      // Send notification
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
      
      // REVERT OPTIMISTIC UPDATE on error
      if (tempMessageId) {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      }
      
      setNewMessage(messageContent);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchMessages();
    fetchConversationDetails();

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
          const isDuplicate = messages.some(msg => 
            msg.id === payload.new.id || 
            (msg.id.startsWith('temp-') && 
            msg.content === payload.new.content &&
            msg.sender_id === payload.new.sender_id)
          );
          
          if (!isDuplicate) {
            setMessages(prev => [...prev, {
              ...payload.new,
              profiles: { full_name: 'Other user' }
            }]);
          }
        }
      )
      .subscribe();

    const markReadTimer = setTimeout(() => {
      markMessagesAsRead();
    }, 500);

    return () => {
      clearTimeout(markReadTimer);
      subscription.unsubscribe();
      hasMarkedAsRead.current = false;
      refreshNotifications();
    };
  }, [applicationId, user]);

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.theirMessageTime
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {item.id.startsWith('temp-') && ' • Sending...'}
          </Text>
        </View>
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
        <Text style={styles.chatPartnerText}>
          Chat with {otherPartyName}
        </Text>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation by sending a message below.
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[
                styles.textInput,
                { height: Math.min(inputHeight, 120) }
              ]}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              editable={!sending}
              onContentSizeChange={(e) => {
                setInputHeight(e.nativeEvent.contentSize.height);
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons 
                name="arrow-up-circle" 
                size={34} 
                color={newMessage.trim() ? COLORS.primary : COLORS.gray300} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  chatPartnerText: {
    textAlign: 'center', 
    color: COLORS.gray600, 
    marginBottom: SIZES.padding,
    fontStyle: 'italic',
    fontSize: SIZES.small,
    padding: SIZES.padding,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.radius,
    margin: SIZES.padding
  },
  messagesList: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2, // Extra padding at bottom for messages
  },
  messageContainer: {
    marginBottom: SIZES.margin,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SIZES.padding,
    borderRadius: 18,
    marginBottom: 4,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.gray200,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: SIZES.medium,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  theirMessageText: {
    color: COLORS.gray900,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  myMessageTime: {
    color: COLORS.white,
    textAlign: 'right',
  },
  theirMessageTime: {
    color: COLORS.gray600,
    textAlign: 'left',
  },
  emptyContainer: {
    alignItems: 'center', 
    padding: 40,
    paddingBottom: 80, // Extra padding when no messages
  },
  emptyText: {
    color: COLORS.gray600, 
    fontSize: SIZES.medium,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.gray500, 
    fontSize: SIZES.small, 
    textAlign: 'center',
  },
  inputContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 3, // Extra padding at bottom
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.gray100,
    borderRadius: 25,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 6,
    marginHorizontal: 0,
  },
  textInput: {
    flex: 1,
    fontSize: SIZES.medium,
    maxHeight: 120,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    padding: 6,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
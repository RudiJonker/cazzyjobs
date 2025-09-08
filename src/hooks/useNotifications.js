// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('useNotifications: No user found');
      return;
    }

    console.log('useNotifications: Starting for user:', user.id);

    // Fetch initial count of UNREAD MESSAGES
    const fetchUnreadCount = async () => {
      try {
        console.log('Fetching unread MESSAGES...');
        
        // Step 1: Get all applications where user is either worker OR employer
        
        // Query 1: Applications where user is the worker
        const { data: workerApps, error: workerError } = await supabase
          .from('applications')
          .select('id')
          .eq('worker_id', user.id)
          .eq('status', 'hired');

        if (workerError) {
          console.error('Error fetching worker applications:', workerError);
          return;
        }

        // Query 2: Applications where user is the employer (via jobs table)
        const { data: employerApps, error: employerError } = await supabase
          .from('jobs')
          .select('applications!inner(id)')
          .eq('employer_id', user.id)
          .eq('applications.status', 'hired');

        if (employerError) {
          console.error('Error fetching employer applications:', employerError);
          return;
        }

        // Combine application IDs from both queries
        const workerAppIds = workerApps?.map(app => app.id) || [];
        const employerAppIds = employerApps?.map(job => job.applications[0]?.id).filter(id => id) || [];
        
        const allApplicationIds = [...new Set([...workerAppIds, ...employerAppIds])];

        if (allApplicationIds.length === 0) {
          setUnreadCount(0);
          return;
        }

        console.log('User is involved in these applications:', allApplicationIds);
        
        // Step 2: Count unread messages in the user's conversations
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('read', false)
          .neq('sender_id', user.id) // Only count messages others sent
          .in('application_id', allApplicationIds);

        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }

        console.log('Found', count, 'unread MESSAGES');
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
      }
    };

    fetchUnreadCount();

    // Create a single channel for all message changes
    const messageChannel = supabase
      .channel('messages-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // When a new message is inserted, check if it's relevant to this user
          if (payload.new.sender_id !== user.id) {
            console.log('New message received via realtime from others:', payload);
            // Refetch the count to ensure accuracy
            fetchUnreadCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message updated via realtime:', payload);
          // Refetch the count whenever any message is updated
          // This ensures we catch when messages are marked as read
          fetchUnreadCount();
        }
      )
      .subscribe();

    console.log('useNotifications: Subscriptions setup complete');

    // Cleanup subscription on unmount
    return () => {
      console.log('useNotifications: Cleaning up subscriptions');
      supabase.removeChannel(messageChannel);
    };
  }, [user]);

  console.log('useNotifications: Returning unreadCount:', unreadCount);
  return { unreadCount };
};
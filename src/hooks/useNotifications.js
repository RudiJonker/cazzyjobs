import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    try {
      setRefreshing(true);
      
      if (!user) {
        setUnreadCount(0);
        return;
      }

      // METHOD 1: Get applications where user is the worker
      const { data: workerApps, error: workerError } = await supabase
        .from('applications')
        .select('id')
        .eq('status', 'hired')
        .eq('worker_id', user.id);

      if (workerError) {
        console.error('Error fetching worker applications:', workerError);
        return;
      }

      // METHOD 2: Get applications where user is the employer (via jobs table)
      const { data: employerJobs, error: employerError } = await supabase
        .from('jobs')
        .select('id, applications!inner(id)')
        .eq('employer_id', user.id)
        .eq('applications.status', 'hired');

      if (employerError) {
        console.error('Error fetching employer jobs:', employerError);
        return;
      }

      // Extract application IDs from both queries
      const workerAppIds = workerApps?.map(app => app.id) || [];
      const employerAppIds = employerJobs?.flatMap(job => 
        job.applications?.map(app => app.id)
      ).filter(id => id) || [];

      // Combine all application IDs
      const allApplicationIds = [...new Set([...workerAppIds, ...employerAppIds])];

      if (allApplicationIds.length === 0) {
        setUnreadCount(0);
        return;
      }
      
      // Count unread messages in these applications
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .neq('sender_id', user.id)
        .in('application_id', allApplicationIds);

      if (error) {
        console.error('Error counting unread messages:', error);
        return;
      }

      setUnreadCount(count || 0);
      
    } catch (error) {
      console.error('Error in fetchUnreadCount:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Remove automatic polling completely - only fetch when manually called
  useEffect(() => {
    if (user) {
      // Only fetch initially when user logs in
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  return { 
    unreadCount, 
    refreshing, 
    refreshNotifications: fetchUnreadCount 
  };
};
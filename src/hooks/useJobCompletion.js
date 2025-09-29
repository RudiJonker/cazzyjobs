import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useJobCompletion = () => {
  const { user } = useAuth();
  const [jobsNeedingCompletion, setJobsNeedingCompletion] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if a job's end time has passed
  const hasJobEnded = (job) => {
    if (!job.job_date || !job.end_time) return false;
    
    // Combine job_date and end_time into a single Date object
    const jobEndDateTime = new Date(
      `${job.job_date}T${job.end_time}`
    );
    
    const now = new Date();
    return now > jobEndDateTime;
  };

  // Fetch employer's hired jobs that need completion
  const fetchJobsNeedingCompletion = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all employer's jobs that are active and have a hired worker
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          hired_worker:profiles!hired_worker_id (
            id,
            full_name,
            user_role
          )
        `)
        .eq('employer_id', user.id)
        .eq('status', 'active')
        .not('hired_worker_id', 'is', null);

      if (error) throw error;

      // Filter jobs where end time has passed
      const jobsToComplete = jobs.filter(job => 
        hasJobEnded(job) && job.hired_worker
      );

      setJobsNeedingCompletion(jobsToComplete);
      
    } catch (error) {
      console.error('Error fetching jobs needing completion:', error);
      setJobsNeedingCompletion([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark a job as "completion notified" (we'll track this locally for now)
  const markAsNotified = (jobId) => {
    setJobsNeedingCompletion(prev => 
      prev.filter(job => job.id !== jobId)
    );
  };

  // Add this function to check if job should be in completion state
const shouldShowCompletion = (job) => {
  if (!job.job_date || !job.end_time) return false;
  
  const jobEndDateTime = new Date(`${job.job_date}T${job.end_time}`);
  const now = new Date();
  
  // Job has ended + 24-hour grace period hasn't passed
  const hoursSinceEnd = (now - jobEndDateTime) / (1000 * 60 * 60);
  return hoursSinceEnd >= 0 && hoursSinceEnd <= 24;
};

  // Refresh when user changes or on focus
  useEffect(() => {
    if (user) {
      fetchJobsNeedingCompletion();
    }
  }, [user]);

  return {
    jobsNeedingCompletion,
    loading,
    refetch: fetchJobsNeedingCompletion,
    markAsNotified
  };
};
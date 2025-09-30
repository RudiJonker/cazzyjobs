import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useJobCompletion = () => {
  const { user } = useAuth();
  const [jobsNeedingCompletion, setJobsNeedingCompletion] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if job should show completion modal (within 24-hour window)
  const isJobReadyForCompletion = (job) => {
    if (!job.job_date || !job.end_time || !job.hired_worker_id) {
      return false;
    }
    
    // Combine job date and end time
    const jobEndDateTime = new Date(`${job.job_date}T${job.end_time}`);
    const now = new Date();
    
    // Job has ended
    const hasEnded = now > jobEndDateTime;
    const notCompleted = job.status === 'active';
    
    // Calculate hours since job ended
    const hoursSinceEnd = (now - jobEndDateTime) / (1000 * 60 * 60);
    
    // Show completion modal for 24 hours after job ends
    const within24HourWindow = hoursSinceEnd >= 0 && hoursSinceEnd <= 24;
    
    return hasEnded && notCompleted && within24HourWindow;
  };

  // Check if job needs auto-completion (past 24 hours)
  const needsAutoCompletion = (job) => {
    if (!job.job_date || !job.end_time || !job.hired_worker_id) {
      return false;
    }
    
    const jobEndDateTime = new Date(`${job.job_date}T${job.end_time}`);
    const now = new Date();
    const hoursSinceEnd = (now - jobEndDateTime) / (1000 * 60 * 60);
    
    // Auto-complete after 24 hours
    return hoursSinceEnd > 24 && job.status === 'active';
  };

  // Auto-complete job with 3-star rating after 24 hours
  const autoCompleteJob = async (job) => {
    try {
      console.log('⚡ Auto-completing job:', job.title);
      
      // 1. Update job status to completed with 3-star rating
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_rating: 3 // Default 3-star rating
        })
        .eq('id', job.id);

      if (jobError) throw jobError;

      // 2. Update worker's average rating
      const { data: workerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('average_rating, total_ratings')
        .eq('id', job.hired_worker_id)
        .single();

      if (profileError) throw profileError;

      const currentTotalRatings = workerProfile.total_ratings || 0;
      const currentAverage = workerProfile.average_rating || 0;
      
      const newTotalRatings = currentTotalRatings + 1;
      const newAverage = ((currentAverage * currentTotalRatings) + 3) / newTotalRatings;

      // Update worker's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          average_rating: Math.round(newAverage * 10) / 10,
          total_ratings: newTotalRatings
        })
        .eq('id', job.hired_worker_id);

      if (updateError) throw updateError;

      // 3. Update application status
      const { error: applicationError } = await supabase
        .from('applications')
        .update({ status: 'completed' })
        .eq('job_id', job.id)
        .eq('worker_id', job.hired_worker_id)
        .eq('status', 'hired');

      if (applicationError) throw applicationError;

      return true;
      
    } catch (error) {
      console.error('Error auto-completing job:', error);
      return false;
    }
  };

  // Fetch employer's hired jobs that need completion
  const fetchJobsNeedingCompletion = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all employer's active jobs with hired workers
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

      // Filter jobs that are ready for completion (within 24-hour window)
      const jobsToComplete = jobs.filter(job => 
        isJobReadyForCompletion(job) && job.hired_worker
      );

      // Only log when there are jobs to complete
      if (jobsToComplete.length > 0) {
        console.log('🔔 Jobs needing completion:', jobsToComplete.length);
      }

      setJobsNeedingCompletion(jobsToComplete);

      // Check for jobs that need auto-completion (past 24 hours)
      const jobsNeedingAutoComplete = jobs.filter(job => 
        needsAutoCompletion(job) && job.hired_worker
      );

      if (jobsNeedingAutoComplete.length > 0) {
        console.log('⚡ Auto-completing', jobsNeedingAutoComplete.length, 'jobs');
        
        // Auto-complete each job
        for (const job of jobsNeedingAutoComplete) {
          await autoCompleteJob(job);
        }
        
        // Refresh the list after auto-completion
        fetchJobsNeedingCompletion();
      }
      
    } catch (error) {
      console.error('Error fetching jobs needing completion:', error);
      setJobsNeedingCompletion([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark a job as notified (remove from list)
  const markAsNotified = (jobId) => {
    setJobsNeedingCompletion(prev => 
      prev.filter(job => job.id !== jobId)
    );
  };

  // Refresh when user changes
  useEffect(() => {
    if (user) {
      fetchJobsNeedingCompletion();
    }
  }, [user]);

  return {
    jobsNeedingCompletion,
    loading,
    refetch: fetchJobsNeedingCompletion,
    markAsNotified,
    autoCompleteJob
  };
};
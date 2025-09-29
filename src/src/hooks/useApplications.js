// src/hooks/useApplications.js
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useApplications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyToJob = async (jobId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log("Applying to job:", jobId, "as user:", user.id);

      // 2. Insert application
      const { data, error: applyError } = await supabase
        .from('applications')
        .insert([
          {
            job_id: jobId,
            worker_id: user.id,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (applyError) {
        // Check if it's a self-application error
        if (applyError.message.includes('own job')) {
          throw new Error('You cannot apply to your own job');
        }
        // Check if it's a duplicate application
        if (applyError.code === '23505') {
          throw new Error('You have already applied to this job');
        }
        throw applyError;
      }

      console.log("Application successful:", data);
      return { success: true, application: data };

    } catch (err) {
      console.error('Application error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { applyToJob, loading, error };
};
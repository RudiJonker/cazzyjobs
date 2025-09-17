// src/hooks/useEmployerJobs.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useEmployerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchEmployerJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setJobs([]);
        return;
      }

      const { data: jobsData, error: supabaseError } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setJobs(jobsData || []);
      
    } catch (err) {
      console.error('Error fetching employer jobs:', err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmployerJobs();
    }
  }, [user]);

  return { jobs, loading, error, refetch: fetchEmployerJobs };
};
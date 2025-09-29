// src/hooks/useJobs.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCityFromDeviceLocation, getDefaultCity } from '../utils/location';

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Get the user's city (device location or default)
      let userCity = await getCityFromDeviceLocation();
      if (!userCity) {
        userCity = getDefaultCity();
        console.log("Using default city:", userCity);
      }

      console.log("Fetching jobs for city:", userCity);

      // 2. Fetch jobs from Supabase filtered by city
      const { data: jobsData, error: supabaseError } = await supabase
        .from('jobs')
        .select('*')
        .eq('job_city', userCity) // ← CRITICAL: Filter by user's city
        .eq('status', 'active')   // ← Only show active jobs
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setJobs(jobsData || []);
      
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
      setJobs([]); // Clear jobs on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, loading, error, refetch: fetchJobs };
};
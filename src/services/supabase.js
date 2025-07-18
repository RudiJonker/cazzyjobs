import 'react-native-url-polyfill/auto';
  import { createClient } from '@supabase/supabase-js';

  export const supabase = createClient(
    'https://tibdaygeycdxxvesoupi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYmRheWdleWNkeHh2ZXNvdXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDI2OTksImV4cCI6MjA2ODMxODY5OX0.rCh33yAKwzPg-X2BKhrgg7pnPzfvCGb8xiAHDo-GLYA'
  );
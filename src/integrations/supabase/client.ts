
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lhopphwobvxrhfjeuyni.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxob3BwaHdvYnZ4cmhmamV1eW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTUwNjUsImV4cCI6MjA2MDY5MTA2NX0.tM_RBavew2i6TM8lkSVehnk5gOnzeS5G8oPifqIySqc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

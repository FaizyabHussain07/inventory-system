import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://skejyzdwtsshhrarfpmi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWp5emR3dHNzaGhyYXJmcG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDEyMzYsImV4cCI6MjA3NjUxNzIzNn0._aPcSI_saeJopYwwXP5UpNc3tel3bDMIY550ZON84O0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
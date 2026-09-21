import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://slrjtctvyhhbwwcgomcy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BLYmFLhC_EstHmfnHt2UpA_4LATE0c9';

export const supabase = createClient(supabaseUrl, supabaseKey);

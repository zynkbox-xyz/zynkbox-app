import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EmailRecord {
  id: string;
  inbox_address: string;
  sender: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  otp_code: string | null;
  received_at: string;
  is_starred?: boolean;
  is_archived?: boolean;
}
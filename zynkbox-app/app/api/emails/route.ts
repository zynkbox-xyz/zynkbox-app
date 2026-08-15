import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Missing address query parameter' }, { status: 400 });
  }

  const { data: emails, error } = await supabase
    .from('emails')
    .select('*')
    .eq('inbox_address', address.toLowerCase())
    .order('received_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const latestOtp = emails?.find((e) => e.otp_code !== null)?.otp_code || null;

  return NextResponse.json({
    success: true,
    inbox: address,
    count: emails?.length || 0,
    latest_otp: latestOtp,
    emails: emails || [],
  });
}
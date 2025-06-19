/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { randomBytes } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Hard-coded for development - use environment variables in production
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://jdfnkvbfpvzddjtgiovj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZm5rdmJmcHZ6ZGRqdGdpb3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc4MTk5NywiZXhwIjoyMDY1MzU3OTk3fQ.hoKE2mKtUHVR1ufoiHdA9mNcbajOuB0e1LJ6Rx8K_R0';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZm5rdmJmcHZ6ZGRqdGdpb3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3ODE5OTcsImV4cCI6MjA2NTM1Nzk5N30.zHUA-ESeIWzsfEpkt6O7-nWOBLaBf8MCEQlUb2JcnOI';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create admin client with service role key
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface RequestBody {
  phone: string;
  otp: string;
}

console.log("Edge Function: verify-otp");

serve(async (req) => {
  console.log("Verify OTP function called");
  
  // CORS headers for development
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const { phone, otp } = await req.json() as RequestBody;
    
    console.log(`Verifying OTP for phone: ${phone}`);
    
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: 'Phone number and OTP are required' }),
        { status: 400, headers }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify OTP from database using admin client
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otps')
      .select()
      .eq('phone', phone)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    console.log("OTP record:", otpRecord);
    console.log("OTP fetch error:", fetchError);

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { status: 401, headers }
      );
    }

    // Delete the used OTP record using admin client
    await supabase
      .from('otps')
      .delete()
      .eq('id', otpRecord.id);
    
    console.log("OTP record deleted");

    // Check if user exists using admin client
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({});
    console.log(`Found ${users?.users.length || 0} users`);
    
    const existingUser = users?.users.find(u => u.phone === phone);
    console.log("Existing user check:", existingUser ? "Found" : "Not found");
    
    let userId;
    
    // User doesn't exist, create one
    if (!existingUser) {
      console.log("Creating new user");
      
      const password = randomBytes(12).toString('hex');
      const { data: { user: newUser }, error: createError } = await supabase.auth.admin
        .createUser({
          phone: phone,
          phone_confirmed: true,
          email_confirmed: true,
          password: password,
        });
      
      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers }
        );
      }
      
      userId = newUser?.id;
      console.log("New user created with ID:", userId);
    } else {
      userId = existingUser.id;
      console.log("Using existing user with ID:", userId);
    }

    // Create a session directly using admin API
    const { data: sessionData, error: sessionError } = await supabase.auth.admin
      .createSession({
        user_id: userId,
      });

    if (sessionError || !sessionData) {
      console.error("Error creating session:", sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers }
      );
    }

    console.log("Session created successfully with admin API");
    
    // Return the session data that includes properly signed tokens
    return new Response(
      JSON.stringify({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        token_type: "bearer",
        provider: 'phone',
        user: sessionData.user,
        expires_in: 86400, // 24 hours in seconds
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers }
    );
  }
});

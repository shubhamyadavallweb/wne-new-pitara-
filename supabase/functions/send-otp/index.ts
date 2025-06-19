/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jdfnkvbfpvzddjtgiovj.supabase.co';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

const NIMBUS_BASE_URL = 'https://api.nimbussms.com/api/v1/sms';

interface RequestBody {
  phone: string;
}

serve(async (req) => {
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
    const { phone } = await req.json() as RequestBody;
    console.log(`Sending OTP to phone: ${phone}`);
    
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers }
      );
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP: ${otp}`);
    
    // Check if we have Nimbus SMS credentials
    const nimbusUser = Deno.env.get('NIMBUS_USER');
    const nimbusAuthKey = Deno.env.get('NIMBUS_AUTHKEY');
    const nimbusSender = Deno.env.get('NIMBUS_SENDER');
    const nimbusEntityId = Deno.env.get('NIMBUS_ENTITYID');
    const nimbusTemplateId = Deno.env.get('NIMBUS_TEMPLATEID');
    
    if (nimbusUser && nimbusAuthKey && nimbusSender) {
      try {
        const nimbusParams = new URLSearchParams({
          user: nimbusUser,
          authkey: nimbusAuthKey,
          sender: nimbusSender,
          mobile: phone,
          message: `Your OTP is ${otp}`,
          entityid: nimbusEntityId || '',
          templateid: nimbusTemplateId || '',
        });

        console.log('Calling Nimbus SMS API');
        const response = await fetch(`${NIMBUS_BASE_URL}?${nimbusParams.toString()}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`SMS API error: ${response.status} - ${errorText}`);
          // Continue execution - we'll still store the OTP even if SMS fails
        } else {
          console.log('SMS sent successfully');
        }
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Continue execution - we'll still store the OTP even if SMS fails
      }
    } else {
      console.log('SMS credentials not configured, skipping SMS send');
      // For development, log the OTP
      console.log(`DEVELOPMENT MODE - OTP for ${phone}: ${otp}`);
    }

    // Store OTP in database for verification
    const { data: otpData, error: otpError } = await supabaseClient
      .from('otps')
      .insert([
        {
          phone,
          otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        },
      ])
      .select();

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return new Response(
        JSON.stringify({ error: 'Failed to store OTP' }),
        { status: 500, headers }
      );
    }

    console.log('OTP stored successfully');
    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send OTP' }),
      { status: 500, headers }
    );
  }
}); 
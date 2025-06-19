-- Create otps table
CREATE TABLE IF NOT EXISTS public.otps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone text NOT NULL,
    otp text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_otps_phone ON public.otps(phone);

-- Add RLS policies
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Allow the service role to manage OTPs
CREATE POLICY "Service role can manage OTPs"
ON public.otps FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 
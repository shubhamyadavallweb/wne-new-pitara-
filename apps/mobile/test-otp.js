// Test script for OTP functionality
require('dotenv').config({ path: '../../.env' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hatsyhittlnzingruvwp.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Send OTP to a phone number
 * @param {string} phone Phone number with country code (e.g., +919876543210)
 */
async function sendOTP(phone) {
  console.log(`${colors.blue}Sending OTP to ${phone}...${colors.reset}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`${colors.green}✓ OTP sent successfully${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to send OTP: ${result.error}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Verify OTP
 * @param {string} phone Phone number with country code
 * @param {string} otp The OTP to verify
 */
async function verifyOTP(phone, otp) {
  console.log(`${colors.blue}Verifying OTP ${otp} for ${phone}...${colors.reset}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone, otp }),
    });
    
    const result = await response.json();
    
    if (response.ok && result.access_token) {
      console.log(`${colors.green}✓ OTP verification successful${colors.reset}`);
      console.log(`${colors.cyan}User ID: ${result.user.id}${colors.reset}`);
      return result;
    } else {
      console.log(`${colors.red}✗ Failed to verify OTP: ${result.error}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Run test flow
 */
async function runTest() {
  console.log(`${colors.yellow}=== OTP TEST SCRIPT ===${colors.reset}`);
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  
  // Get phone number from command line argument or use default
  const phone = process.argv[2] || '+919876543210';
  
  // Send OTP
  const otpSent = await sendOTP(phone);
  
  if (otpSent) {
    // If OTP is sent, prompt for manual verification
    console.log(`\n${colors.yellow}Enter the OTP received on ${phone} to continue:${colors.reset}`);
    console.log(`${colors.cyan}(If testing, you can check the edge function logs in Supabase dashboard)${colors.reset}`);
    
    // In a real script, we would prompt for OTP input here
    // For this demo, we'll use a mock OTP
    console.log(`${colors.yellow}Since this is a test script without user input, use the OTP from the logs${colors.reset}`);
    
    // If you want to test with a specific OTP, uncomment and modify this line:
    // const mockOtp = '123456';
    // await verifyOTP(phone, mockOtp);
  }
}

// Run the test
runTest().catch(console.error); 
// Interactive test script for OTP functionality
require('dotenv').config({ path: '../../.env' });
const readline = require('readline');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hatsyhittlnzingruvwp.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * Ask a question and get user input
 * @param {string} question The question to ask
 * @returns {Promise<string>} The user's answer
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Run interactive test flow
 */
async function runInteractiveTest() {
  console.log(`${colors.yellow}=== INTERACTIVE OTP TEST SCRIPT ===${colors.reset}`);
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Get phone number from command line argument or ask for it
    let phone = process.argv[2];
    if (!phone) {
      phone = await askQuestion(`${colors.yellow}Enter your phone number with country code (e.g. +919876543210): ${colors.reset}`);
    }
    
    // Validate phone number format
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
      console.log(`${colors.red}Invalid phone number format. Please include country code (e.g., +919876543210)${colors.reset}`);
      rl.close();
      return;
    }
    
    // Send OTP
    const otpSent = await sendOTP(phone);
    
    if (otpSent) {
      // If OTP is sent, prompt for verification code
      const userOtp = await askQuestion(`\n${colors.yellow}Enter the OTP received on ${phone}: ${colors.reset}`);
      
      // Validate OTP format
      if (!/^\d{6}$/.test(userOtp)) {
        console.log(`${colors.red}Invalid OTP format. Must be 6 digits.${colors.reset}`);
        rl.close();
        return;
      }
      
      // Verify the OTP
      const result = await verifyOTP(phone, userOtp);
      
      if (result) {
        console.log(`\n${colors.green}Authentication successful!${colors.reset}`);
        console.log(`${colors.cyan}Access Token: ${result.access_token.substring(0, 15)}...${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

// Run the interactive test
runInteractiveTest(); 
require('dotenv').config();
const { sendSignupConfirmation } = require('./utils/emailService');

console.log('=== Testing Signup Confirmation Email ===\n');

// Check if email is configured
console.log('Email Configuration:');
console.log(`  Host: ${process.env.EMAIL_HOST}`);
console.log(`  Port: ${process.env.EMAIL_PORT}`);
console.log(`  User: ${process.env.EMAIL_USER}`);
console.log(`  Password: ${process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET'}`);
console.log('');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ ERROR: Email not configured!');
  console.log('\nPlease configure EMAIL_USER and EMAIL_PASSWORD in .env file');
  console.log('See EMAIL_SETUP.md for instructions\n');
  process.exit(1);
}

if (process.env.EMAIL_USER === 'your-email@gmail.com') {
  console.error('❌ ERROR: Using default email configuration!');
  console.log('\nPlease update EMAIL_USER and EMAIL_PASSWORD in .env file');
  console.log('with your actual email credentials\n');
  console.log('See EMAIL_SETUP.md for Gmail App Password instructions\n');
  process.exit(1);
}

// Send test email
console.log('Sending test signup confirmation email...\n');

const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
const testName = 'Test User';

sendSignupConfirmation(testEmail, testName)
  .then(result => {
    if (result.success) {
      console.log('✅ SUCCESS! Signup confirmation email sent!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Sent to: ${testEmail}`);
      console.log('\nCheck your inbox to verify the email was received.');
      console.log('If you don\'t see it, check your spam folder.\n');
    } else {
      console.log('❌ FAILED to send email');
      console.log(`   Error: ${result.error}`);
      console.log('\nTroubleshooting:');
      console.log('  1. Check your EMAIL_USER and EMAIL_PASSWORD in .env');
      console.log('  2. For Gmail, make sure you\'re using an App Password');
      console.log('  3. Check if port 587 is blocked by your firewall');
      console.log('  4. See EMAIL_SETUP.md for detailed instructions\n');
    }
  })
  .catch(error => {
    console.error('❌ ERROR:', error.message);
    console.log('\nSee EMAIL_SETUP.md for configuration instructions\n');
  });

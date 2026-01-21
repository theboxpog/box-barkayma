const { sendPasswordReset } = require('./utils/emailService');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=== Testing Password Reset Email Directly ===\n');

const testEmail = 'yshayu0000@gmail.com';
const testName = 'אברישאבר אברישאבר';

// Generate a test reset token
const resetToken = jwt.sign(
  { id: 29, email: testEmail },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log(`Sending password reset email to: ${testEmail}`);
console.log('Please wait...\n');

sendPasswordReset(testEmail, testName, resetToken)
  .then(result => {
    if (result.success) {
      console.log('✅ Password reset email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📧 CHECK YOUR INBOX at yshayu0000@gmail.com');
      console.log('   Subject: "Password Reset Request - Tool Rental"');
      console.log('   The email contains:');
      console.log('   - A "Reset Password" button');
      console.log('   - The reset link (expires in 1 hour)');
      console.log('   - Security information\n');
      console.log('Also check your SPAM/JUNK folder!\n');
    } else {
      console.log('❌ Email failed to send!');
      console.log(`   Error: ${result.error}\n`);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
  });

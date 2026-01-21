const { sendSignupConfirmation } = require('./utils/emailService');

console.log('=== Sending Manual Confirmation Email ===\n');

const userEmail = 'yshayu0000@gmail.com';
const userName = 'אברישאבר אברישאבר';

console.log(`Sending confirmation email to: ${userEmail}`);
console.log('Please wait...\n');

sendSignupConfirmation(userEmail, userName)
  .then(result => {
    if (result.success) {
      console.log('✅ Confirmation email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📧 CHECK YOUR INBOX NOW at yshayu0000@gmail.com');
      console.log('   Subject: "Welcome to Tool Rental - Signup Confirmation"');
      console.log('   Also check SPAM/JUNK folder!\n');
    } else {
      console.log('❌ Email failed to send!');
      console.log(`   Error: ${result.error}\n`);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
  });

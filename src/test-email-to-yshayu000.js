const { sendSignupConfirmation } = require('./utils/emailService');

console.log('=== Sending Test Email ===\n');

const userEmail = 'yshayu000@gmail.com';  // 3 zeros
const userName = 'ישעיהו אברבוך';

console.log(`Sending test email to: ${userEmail}`);
console.log('Please wait...\n');

sendSignupConfirmation(userEmail, userName)
  .then(result => {
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📧 Check your inbox at yshayu000@gmail.com');
      console.log('   Also check your spam/junk folder.\n');
    } else {
      console.log('❌ Email failed to send!');
      console.log(`   Error: ${result.error}\n`);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
  });

const { sendSignupConfirmation } = require('./utils/emailService');

console.log('=== Testing Direct Email to Your Address ===\n');

const userEmail = 'yshayu0000@gmail.com';
const userName = 'Test User';

console.log(`Sending test email to: ${userEmail}`);
console.log('Please wait...\n');

sendSignupConfirmation(userEmail, userName)
  .then(result => {
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📧 Check your inbox at yshayu0000@gmail.com');
      console.log('   Also check your spam/junk folder if you don\'t see it.\n');
    } else {
      console.log('❌ Email failed to send!');
      console.log(`   Error: ${result.error}\n`);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
    console.error('   Full error:', error);
  });

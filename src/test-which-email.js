const { sendSignupConfirmation } = require('./utils/emailService');

console.log('=== Testing Which Email You Have Access To ===\n');

console.log('I will send a test email to yshayu0000@gmail.com (4 zeros)');
console.log('This is the email configured in your .env file.\n');

const email4zeros = 'yshayu0000@gmail.com';
const testName = 'Test User';

console.log(`Sending test email to: ${email4zeros}`);
console.log('Please wait...\n');

sendSignupConfirmation(email4zeros, testName)
  .then(result => {
    if (result.success) {
      console.log('✅ Email sent successfully to yshayu0000@gmail.com (4 zeros)');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📧 CHECK YOUR INBOX at yshayu0000@gmail.com');
      console.log('   Also check SPAM/JUNK folder!');
      console.log('\nIf you receive THIS email, it means:');
      console.log('   - Your email is: yshayu0000@gmail.com (4 zeros)');
      console.log('   - You signed up with the WRONG email: yshayu000@gmail.com (3 zeros)');
      console.log('   - That\'s why you didn\'t receive the signup confirmation\n');
    } else {
      console.log('❌ Email failed to send!');
      console.log(`   Error: ${result.error}\n`);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
  });

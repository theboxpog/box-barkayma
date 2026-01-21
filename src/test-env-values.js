require('dotenv').config();

console.log('=== Checking Environment Variables ===\n');

console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_HOST (trimmed):', process.env.EMAIL_HOST?.trim());
console.log('EMAIL_HOST length:', process.env.EMAIL_HOST?.length);

console.log('\nEMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_PORT (parsed):', parseInt(process.env.EMAIL_PORT));

console.log('\nEMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_USER (trimmed):', process.env.EMAIL_USER?.trim());
console.log('EMAIL_USER length:', process.env.EMAIL_USER?.length);

console.log('\nEMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***exists***' : 'MISSING');
console.log('EMAIL_PASSWORD (trimmed):', process.env.EMAIL_PASSWORD?.trim() ? '***exists***' : 'MISSING');
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD?.length);

console.log('\n=== All env variables starting with EMAIL ===');
Object.keys(process.env)
  .filter(key => key.startsWith('EMAIL'))
  .forEach(key => {
    console.log(`${key}: ${key.includes('PASSWORD') ? '***' : process.env[key]}`);
  });

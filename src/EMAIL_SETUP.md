# Email Setup Instructions

## Overview 
The application now sends confirmation emails when users sign up.

## Configuration
<!-- jdej flra xedg ougb -->
somi fzgp lwpa xzty 
### 1. Gmail Setup (Recommended for Development)

If using Gmail, you need to create an **App Password**:

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### 2. Update .env File

Edit the `.env` file with your email credentials:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**For Gmail:**
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASSWORD`: The 16-character app password (NOT your regular password)

**For Other Email Providers:**
- **Outlook/Hotmail**: smtp-mail.outlook.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 587
- **Custom SMTP**: Contact your email provider for SMTP settings

### 3. Test the Email Functionality

Run the test script to verify email is working:

```bash
node test-signup-email.js
```

## Features

### Signup Confirmation Email

When a user signs up, they automatically receive an email with:
- Welcome message
- Account details confirmation
- Link to start browsing tools
- Branded HTML template

## Troubleshooting

### Email not sending?

1. **Check .env configuration**: Make sure EMAIL_USER and EMAIL_PASSWORD are correct
2. **Gmail users**: Ensure you're using an App Password, not your regular password
3. **Firewall**: Check if port 587 is blocked
4. **Check server logs**: Look for error messages in the console

### Common Errors

- **"Invalid login"**: Wrong email or password in .env
- **"Connection timeout"**: Firewall blocking port 587
- **"Self-signed certificate"**: Try setting `secure: false` in emailService.js

## Security Notes

- **Never commit .env file** to version control
- Use **environment variables** in production
- For Gmail, **always use App Passwords**, never your main password
- Consider using a dedicated email account for the application

## Production Recommendations

For production, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **Amazon SES** (cost-effective for high volume)

These services offer better deliverability and monitoring than Gmail.

# Google Authentication Setup Guide

Google Sign In has been successfully integrated into your Tool Rental application! Follow these steps to complete the setup.

## What Was Added

### Backend Changes:
1. ✅ Installed `passport`, `passport-google-oauth20`, and `express-session` packages
2. ✅ Added `google_id` column to users table
3. ✅ Created Google auth route at `/api/auth/google/google`
4. ✅ Updated server.js to include Google auth routes

### Frontend Changes:
1. ✅ Installed `@react-oauth/google` package
2. ✅ Added Google Sign In buttons to Login and Signup pages
3. ✅ Wrapped app with `GoogleOAuthProvider`
4. ✅ Added `googleLogin` method to AuthContext

---

## Setup Steps

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth Client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5000`
   - Add authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:5000/api/auth/google/callback`
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Step 2: Update Environment Variables

#### Backend (.env file):
```env
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
```

#### Frontend (.env.local file):
```env
REACT_APP_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

**Important**: Use the same Client ID for both backend and frontend!

### Step 3: Restart Both Servers

After updating the environment variables, restart both servers:

**Terminal 1 (Backend):**
```bash
cd c:\Users\yshay\OneDrive\שולחן העבודה\web_project\tool-rental-app
npm run server
```

**Terminal 2 (Frontend):**
```bash
cd c:\Users\yshay\OneDrive\שולחן העבודה\web_project\tool-rental-app
npm start
```

---

## How It Works

### User Flow:
1. User clicks "Sign in with Google" button on Login or Signup page
2. Google OAuth popup opens for user to authenticate
3. Google returns a credential (JWT token) to the frontend
4. Frontend sends credential to backend endpoint: `POST /api/auth/google/google`
5. Backend decodes the token and extracts user info (email, name, Google ID)
6. Backend checks if user exists:
   - **If exists**: Updates their Google ID (if not set) and logs them in
   - **If new**: Creates a new user account with role='user'
7. Backend generates a JWT token and returns it with user data
8. Frontend stores token and redirects user to homepage

### Security Notes:
- Passwords for Google-authenticated users are set to 'GOOGLE_AUTH' (they can't login with email/password)
- Google ID is stored in the `google_id` column for future authentication
- Users can link their Google account to existing accounts if emails match

---

## Testing

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
2. Click the "Sign in with Google" button
3. Select your Google account in the popup
4. You should be redirected to the homepage, logged in
5. Check the user is created in the database:
   ```bash
   node view-users.js
   ```

---

## Troubleshooting

### Issue: "Google sign in failed"
- Check that you've added the correct Client ID to both `.env` and `.env.local`
- Verify the Client ID is the same in both files
- Ensure authorized origins are set correctly in Google Cloud Console

### Issue: "Invalid Google token"
- The backend might not be able to decode the token
- Make sure both servers are restarted after updating .env files
- Check backend console for error messages

### Issue: Google popup doesn't appear
- Check browser console for errors
- Verify `REACT_APP_GOOGLE_CLIENT_ID` is set in `.env.local`
- Make sure the GoogleOAuthProvider is wrapping the App component

### Issue: "Failed to create user"
- Check backend logs for database errors
- Verify the `google_id` column was added successfully:
  ```bash
  node add-google-id-column.js
  ```

---

## Features

### Implemented:
- ✅ Google Sign In on Login page
- ✅ Google Sign Up on Signup page
- ✅ Automatic account creation for new Google users
- ✅ Account linking for existing email addresses
- ✅ One-Tap sign in (shows Google prompt automatically)
- ✅ Secure token handling

### Future Enhancements:
- Add ability to link/unlink Google account from user profile
- Add Google profile picture to user dashboard
- Add option to set password for Google accounts

---

## API Endpoints

### POST `/api/auth/google/google`
Authenticates user with Google credential

**Request Body:**
```json
{
  "credential": "google-jwt-token-here"
}
```

**Response:**
```json
{
  "token": "your-jwt-token",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "user",
    "picture": "https://..."
  }
}
```

---

## Files Modified

### Backend:
- `server.js` - Added Google auth route
- `routes/google-auth.js` - New Google authentication handler
- `.env` - Added Google credentials
- `add-google-id-column.js` - Migration script

### Frontend:
- `src/index.js` - Added GoogleOAuthProvider
- `src/pages/Login.js` - Added Google Sign In button
- `src/pages/Signup.js` - Added Google Sign Up button
- `src/context/AuthContext.js` - Added googleLogin method
- `src/services/api.js` - Added googleLogin API call
- `.env.local` - Added Google Client ID

---

## Need Help?

If you encounter any issues:
1. Check the browser console for frontend errors
2. Check the backend terminal for server errors
3. Verify all environment variables are set correctly
4. Ensure both servers are running and restarted after .env changes
5. Check that the Google Cloud Console settings match your local URLs

# Debug Login Issue

## Step 1: Open Browser Console

1. Open your browser to http://localhost:3000/login
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab
4. Click on the **Network** tab as well

## Step 2: Try to Login

Enter these credentials:
- **Email:** `toolrentaadmin@l.com`
- **Password:** `admin123`

Click **Login**

## Step 3: Check Network Tab

In the Network tab, look for a request to `/api/auth/login`:

### If you see it:
1. Click on that request
2. Look at the **Status Code** (should be 200 if successful)
3. Look at the **Response** tab - what does it say?
4. Look at the **Headers** tab - what's the Request URL?

### If you DON'T see it:
- The request is not being sent at all
- Check Console tab for errors

## Step 4: Check Console Tab

Look for any red error messages. Common ones:

### Error: "Network Error" or "Failed to fetch"
**Cause:** Can't connect to backend
**Fix:** Make sure backend is running (`npm run server`)

### Error: "CORS policy"
**Cause:** CORS issue
**Fix:** Make sure you're using `http://localhost:3000` (not 127.0.0.1)

### Error: 401 Unauthorized
**Cause:** Wrong credentials
**Fix:** Make sure email/password are exactly correct

## Step 5: Manual Test in Console

Paste this in the browser Console tab and press Enter:

```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@toolrental.com',
    password: 'admin123'
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Response:', data);
  if (data.token) {
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('Token:', data.token);
  }
})
.catch(error => {
  console.log('❌ Error:', error);
});
```

**What does this output say?**

---

## Common Fixes

### Fix 1: Backend Not Running
```bash
# In terminal 1
cd tool-rental-app
npm run server
```

### Fix 2: Clear Browser Cache
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page

### Fix 3: Check Environment Variable
Make sure `.env.local` exists with:
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Report Back

Please tell me:

1. **What status code do you see in Network tab?**
2. **What error message appears in Console tab?**
3. **What does the manual fetch test output?**

This will help me fix the exact issue!

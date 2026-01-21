# How to Start Your Tool Rental Application

## ⚠️ IMPORTANT: You Need TWO Terminal Windows Running

Your application has two parts that must run simultaneously:
1. **Backend Server** (Node.js/Express) - Port 5000
2. **Frontend Server** (React) - Port 3000

---

## 🚀 Quick Start Guide

### Step 1: Start the Backend Server

Open a **NEW terminal window** and run:

```bash
cd c:\Users\yshay\OneDrive\שולחן העבודה\web_project\tool-rental-app
npm run server
```

You should see:
```
🚀 Tool Rental API Server is running!
📍 Port: 5000
🔗 URL: http://localhost:5000
```

**⚠️ KEEP THIS TERMINAL OPEN! Do not close it.**

---

### Step 2: Start the Frontend Server

Open a **SECOND terminal window** and run:

```bash
cd c:\Users\yshay\OneDrive\שולחן העבודה\web_project\tool-rental-app
npm start
```

The React app will open automatically in your browser at `http://localhost:3000`

**⚠️ KEEP THIS TERMINAL OPEN TOO! Do not close it.**

---

## ✅ Verification

After both servers are running:

1. Backend running: http://localhost:5000/api/health should return `{"status":"ok"}`
2. Frontend running: http://localhost:3000 should show your tool rental homepage
3. Both terminals should show logs and be actively running

---

## 🛑 How to Stop Servers

To stop either server:
- Press `Ctrl + C` in the terminal window

---

## ⚡ Alternative: Run Both at Once (Windows)

If you want to run both servers from one command, you can use:

```bash
cd c:\Users\yshay\OneDrive\שולחן העבודה\web_project\tool-rental-app
npm run dev
```

This will start both servers in parallel.

---

## 🐛 Troubleshooting

### "Port 5000 is already in use"
Another process is using port 5000. Either:
- Stop the other process
- Or find and kill it: `netstat -ano | findstr :5000`

### "Port 3000 is already in use"
React dev server is already running. Either:
- Use the existing one
- Stop it and restart
- Use a different port when prompted

### "Google login failed"
Make sure:
1. ✅ Backend server is running (check port 5000)
2. ✅ Frontend server is running (check port 3000)
3. ✅ Both .env files have Google credentials
4. ✅ You restarted BOTH servers after updating .env files

---

## 📝 Current Status

Your environment variables are configured:
- ✅ Google Client ID: `646310434282-gj1uplhn9pabuj95d92o9ftfa0vnoh2d.apps.googleusercontent.com`
- ✅ Google Client Secret: `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`
- ✅ Backend .env: Updated
- ✅ Frontend .env.local: Updated
- ✅ Database migrations: Complete

All you need to do now is **START BOTH SERVERS**!

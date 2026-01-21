# Quick Start Guide

## How to Run the Application

### Step 1: Start the Backend Server
Open a terminal in this directory and run:
```bash
npm run server
```

You should see:
```
🚀 Tool Rental API Server is running!
📍 Port: 5000
🔗 URL: http://localhost:5000
```

### Step 2: Start the Frontend (in a NEW terminal)
Open another terminal in this directory and run:
```bash
npm start
```

Your browser will open automatically at http://localhost:3000

## Pre-configured Admin Account

**Email:** admin@toolrental.com
**Password:** admin123

## Pre-loaded Sample Tools

The database already has 4 sample tools:
1. Power Drill - $25/day
2. Circular Saw - $30/day
3. Ladder 8ft - $15/day
4. Pressure Washer - $45/day

## What to Try

### As a User:
1. Sign up for a new account
2. Browse the tool catalog
3. Click on a tool to see details
4. Select rental dates and check availability
5. Make a reservation (payment is simulated)
6. View your reservations in the dashboard

### As an Admin:
1. Login with the admin account above
2. Click "Admin Panel" in the navigation
3. Try adding, editing, or deleting tools
4. View all reservations from all users
5. Set a tool to maintenance mode

## Data Persistence

All your data is saved in `rental_database.db` and will persist even after closing the servers.

## Need Help?

Check `README.md` for complete documentation.

## Troubleshooting

**Backend won't start:** Make sure port 5000 is not in use
**Frontend won't start:** Make sure port 3000 is not in use
**Can't see tools:** Make sure backend is running first

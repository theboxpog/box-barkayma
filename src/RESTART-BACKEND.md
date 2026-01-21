# How to Restart the Backend Server

The backend server needs to be restarted to load the new reservation management endpoints.

## Steps:

1. **Find the terminal/command prompt running the backend**
   - Look for the window that shows: "Server running on port 5000"

2. **Stop the backend**
   - Press `Ctrl + C` in that terminal
   - Wait until it stops completely

3. **Restart the backend**
   ```bash
   cd tool-rental-app
   npm run server
   ```

4. **Verify it's running**
   - You should see: "Server running on port 5000"
   - Test the health check:
     ```bash
     curl http://localhost:5000/api/health
     ```

## Why is this needed?

Node.js doesn't automatically reload when you change files. The new endpoints I added for managing reservations (mark as delivered, cancel) are in the code but the running server doesn't know about them yet.

## What was added?

Three new admin-only endpoints in `routes/reservations.js`:
- `POST /api/reservations/:id/deliver` - Mark reservation as delivered
- `POST /api/reservations/:id/cancel` - Cancel reservation
- `PATCH /api/reservations/:id/status` - Update reservation status

After restarting, the "Mark Delivered" and "Cancel" buttons in the admin panel will work!

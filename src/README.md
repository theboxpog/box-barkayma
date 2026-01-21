# Tool Rental Website - Full Stack Application

A complete tool rental platform with user authentication, admin panel, payment processing, and reservation management.

## Features

### User Features
- Browse tool catalog with search and category filters
- View detailed tool information with availability calendar
- Create reservations with date selection
- Secure payment processing with Stripe
- User dashboard to view and manage reservations
- Payment history tracking

### Admin Features
- Secure admin authentication
- Add, edit, and delete tools
- Manage tool categories and pricing
- Set tools to maintenance mode
- View all reservations
- Monitor tool availability

### Technical Features
- JWT-based authentication
- Role-based access control (User/Admin)
- SQLite database for persistent storage
- RESTful API architecture
- Real-time availability checking
- Responsive UI with Tailwind CSS

## Installation

Dependencies are already installed. If you need to reinstall:
```bash
npm install
```

## Running the Application

### Start Backend Server
Open a terminal and run:
```bash
npm run server
```
Server will start on http://localhost:5000

### Start Frontend
Open another terminal and run:
```bash
npm start
```
Frontend will start on http://localhost:3000

## Quick Start Guide

### Create an Admin Account
1. Start both backend and frontend servers
2. Go to http://localhost:3000/signup
3. Sign up with your details
4. To make yourself admin, you need to either:
   - Modify the role in the database directly, OR
   - When signing up, use the API directly with role: 'admin'

### Create a Regular User Account
1. Go to http://localhost:3000/signup
2. Fill in the form and submit
3. You'll be automatically logged in

### Add Sample Tools (As Admin)
1. Login as admin
2. Click "Admin Panel" in navigation
3. Click "Add New Tool"
4. Fill in tool details and save

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Tools
- `GET /api/tools` - Get all tools
- `GET /api/tools/:id` - Get tool by ID
- `POST /api/tools` - Create tool (admin only)
- `PUT /api/tools/:id` - Update tool (admin only)
- `DELETE /api/tools/:id` - Delete tool (admin only)
- `GET /api/tools/:id/availability` - Check availability

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/my` - Get user's reservations
- `GET /api/reservations/admin/all` - Get all reservations (admin)
- `DELETE /api/reservations/:id` - Cancel reservation

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

## Database Schema

The SQLite database (`rental_database.db`) contains:

- **users**: User accounts with authentication
- **tools**: Tool inventory with pricing
- **reservations**: Booking records
- **payments**: Payment transactions

## Data Persistence

All data is stored in `rental_database.db`:
- Database file is created automatically on first run
- Data persists across server restarts
- Located in the project root directory

## Project Structure

```
tool-rental-app/
├── server.js              # Main server file
├── database.js            # Database initialization
├── .env                   # Environment variables
├── rental_database.db     # SQLite database (auto-generated)
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   ├── auth.js           # Auth endpoints
│   ├── tools.js          # Tools endpoints
│   ├── reservations.js   # Reservations endpoints
│   └── payments.js       # Payments endpoints
└── src/
    ├── App.js            # Main React component
    ├── context/
    │   └── AuthContext.js # Auth state management
    ├── services/
    │   └── api.js        # API client
    ├── components/
    │   ├── NavBar.js     # Navigation bar
    │   └── ProtectedRoute.js # Route protection
    └── pages/
        ├── Home.js       # Landing page
        ├── Login.js      # Login page
        ├── Signup.js     # Signup page
        ├── ToolsCatalog.js # Tools listing
        ├── ToolDetails.js  # Tool details & booking
        ├── UserDashboard.js # User dashboard
        └── AdminDashboard.js # Admin panel
```

## Technology Stack

**Backend:**
- Node.js + Express
- SQLite3
- JWT Authentication
- Bcrypt.js
- Stripe API

**Frontend:**
- React 19
- React Router v7
- Axios
- Tailwind CSS
- Lucide React Icons

## Troubleshooting

**Port already in use:**
Change PORT in `.env` file

**Database issues:**
Stop server and delete `rental_database.db`, then restart

**CORS errors:**
Ensure backend runs on port 5000 and frontend on port 3000

## License

Educational project

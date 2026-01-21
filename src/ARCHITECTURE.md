# System Architecture Documentation

## Overview

This is a full-stack tool rental platform implementing all requirements from the specification.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Home   │  │  Tools   │  │Dashboard │  │  Admin   │   │
│  │   Page   │  │ Catalog  │  │  (User)  │  │  Panel   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                           │                                   │
│                    ┌──────▼───────┐                         │
│                    │  Auth Context│                         │
│                    │  (JWT State) │                         │
│                    └──────┬───────┘                         │
│                           │                                   │
│                    ┌──────▼───────┐                         │
│                    │  API Service │                         │
│                    │   (Axios)    │                         │
│                    └──────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication Middleware                │  │
│  │              (JWT Verification)                       │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────┼──────────────────────────────────┐  │
│  │         API Routes Layer                              │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │  │
│  │  │ Auth │  │Tools │  │Reserv│  │Paymt │            │  │
│  │  │Routes│  │Routes│  │Routes│  │Routes│            │  │
│  │  └───┬──┘  └───┬──┘  └───┬──┘  └───┬──┘            │  │
│  └──────┼─────────┼─────────┼─────────┼────────────────┘  │
│         │         │         │         │                     │
│         └─────────┴─────────┴─────────┘                     │
│                    │                                         │
│         ┌──────────▼──────────┐                            │
│         │   Database Module   │                            │
│         │    (SQLite ORM)     │                            │
│         └──────────┬──────────┘                            │
└────────────────────┼───────────────────────────────────────┘
                     │
                     │
┌────────────────────▼───────────────────────────────────────┐
│                    DATABASE (SQLite)                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐ │
│  │   users   │  │   tools   │  │reservatio│  │payments│ │
│  │           │  │           │  │    ns     │  │        │ │
│  └───────────┘  └───────────┘  └───────────┘  └────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Authentication System ✅

**Implementation:**
- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (user/admin)

**Files:**
- [routes/auth.js](routes/auth.js) - Auth endpoints
- [middleware/auth.js](middleware/auth.js) - JWT verification
- [src/context/AuthContext.js](src/context/AuthContext.js) - Frontend auth state

**API Endpoints:**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### 2. Tool Management System ✅

**User Side:**
- Browse all tools with filters
- Search by name/description
- Filter by category
- View tool details with pricing
- Check availability calendar

**Admin Side:**
- Full CRUD operations on tools
- Set maintenance mode
- Upload/set tool images
- Manage pricing and inventory

**Files:**
- [routes/tools.js](routes/tools.js) - Tools API
- [src/pages/ToolsCatalog.js](src/pages/ToolsCatalog.js) - User view
- [src/pages/ToolDetails.js](src/pages/ToolDetails.js) - Detail page
- [src/pages/AdminDashboard.js](src/pages/AdminDashboard.js) - Admin management

### 3. Reservation System ✅

**User Features:**
- Select tool and dates
- Real-time availability checking
- Create reservations
- View reservation history
- Cancel reservations

**Admin Features:**
- View all reservations
- Filter by status/tool
- Update reservation status
- Monitor system usage

**Files:**
- [routes/reservations.js](routes/reservations.js) - Reservations API
- [src/pages/UserDashboard.js](src/pages/UserDashboard.js) - User dashboard

**Availability Logic:**
```sql
SELECT * FROM reservations
WHERE tool_id = :tool_id
AND status = 'active'
AND start_date <= :end_date
AND end_date >= :start_date
```

### 4. Payment System ✅

**Implementation:**
- Stripe payment intent creation
- Secure server-side processing
- Payment confirmation
- Transaction history

**Files:**
- [routes/payments.js](routes/payments.js) - Payment API
- Integrated in [src/pages/ToolDetails.js](src/pages/ToolDetails.js)

**Payment Flow:**
1. User creates reservation
2. Server creates Stripe payment intent
3. Payment processed (simulated in demo)
4. Confirmation stored in database
5. Receipt available in dashboard

### 5. Database Schema ✅

**Tables:**

**users:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**tools:**
```sql
CREATE TABLE tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_day REAL NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**reservations:**
```sql
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tool_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tool_id) REFERENCES tools(id)
)
```

**payments:**
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  success INTEGER DEFAULT 0,
  stripe_payment_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### 6. Data Persistence ✅

**Storage:**
- SQLite database file: `rental_database.db`
- Persistent across server restarts
- No data loss on shutdown

**Backup Strategy:**
- File-based database (easy to backup)
- Copy `rental_database.db` for backup
- Restore by replacing the file

## Frontend Pages

### Public Pages:
1. **Home** - Landing page with features
2. **Tools Catalog** - Browse all tools
3. **Tool Details** - Detailed view + booking
4. **Login** - User authentication
5. **Signup** - Account creation

### Protected Pages (Auth Required):
6. **User Dashboard** - Reservations & payments
7. **Admin Dashboard** - Management panel (admin only)

## Security Features

1. **Authentication:**
   - Passwords hashed with bcrypt (10 rounds)
   - JWT tokens with expiration (7 days)
   - Token stored in localStorage
   - Auto-logout on token expiration

2. **Authorization:**
   - Role-based access control
   - Protected routes on frontend
   - Middleware verification on backend
   - Admin-only endpoints secured

3. **API Security:**
   - CORS configuration
   - Parameterized queries (SQL injection prevention)
   - Input validation
   - Error handling

## Technology Justifications

### Why SQLite?
- File-based (easy deployment)
- No separate database server needed
- Perfect for small to medium scale
- Built-in persistence
- Zero configuration

### Why JWT?
- Stateless authentication
- Scalable (no server sessions)
- Works across domains
- Secure with proper secret

### Why React Context?
- Built-in state management
- No external dependencies
- Perfect for auth state
- Easy to implement

### Why Express?
- Minimal and flexible
- Large ecosystem
- Easy routing
- Excellent middleware support

## Deployment Considerations

### Production Checklist:
- [ ] Change JWT_SECRET to strong random value
- [ ] Update CORS origin to production URL
- [ ] Configure real Stripe keys
- [ ] Set up HTTPS
- [ ] Enable rate limiting
- [ ] Set up proper logging
- [ ] Configure database backups
- [ ] Set secure cookie options
- [ ] Enable helmet.js for security headers
- [ ] Set up environment-specific configs

### Scaling Options:
- Move to PostgreSQL/MySQL for larger scale
- Add Redis for session caching
- Implement CDN for static assets
- Add load balancer for multiple instances
- Implement database connection pooling

## API Response Formats

**Success Response:**
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

## Status Codes Used

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Development Workflow

1. Start backend: `npm run server`
2. Start frontend: `npm start`
3. Backend runs on port 5000
4. Frontend runs on port 3000
5. API calls proxied to backend

## Testing Strategy

### Manual Testing:
- User registration and login
- Tool browsing and filtering
- Reservation creation
- Payment processing
- Admin tool management
- Availability checking
- Data persistence verification

### Automated Testing (Future):
- Unit tests for API routes
- Integration tests for workflows
- E2E tests with Cypress
- Component tests with React Testing Library

## Compliance with Requirements

✅ **Authentication System** - JWT with signup, login, password reset
✅ **Tool Management** - Full CRUD for users and admins
✅ **Reservation System** - Create, view, cancel with availability check
✅ **Payment Integration** - Stripe payment intents
✅ **Backend API** - RESTful Express server
✅ **Database** - SQLite with 4 tables, persistent storage
✅ **Availability Logic** - Date range conflict checking
✅ **Frontend** - React with router, all pages implemented
✅ **Admin Dashboard** - Full management interface
✅ **Data Persistence** - SQLite file-based storage

## Performance Considerations

- Database indexes on foreign keys
- JWT reduces database queries
- React context prevents prop drilling
- Lazy loading routes (future optimization)
- Image optimization needed for uploads

## Future Enhancements

See [README.md](README.md) for planned features

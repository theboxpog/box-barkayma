require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database
const db = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/google-auth');
const toolsRoutes = require('./routes/tools');
const reservationsRoutes = require('./routes/reservations');
const paymentsRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');
const couponsRoutes = require('./routes/coupons');
const contactRoutes = require('./routes/contact');
const contactInfoRoutes = require('./routes/contact-info');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*'
}));

// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:3001'],
//   credentials: true
// }));

// Body parser middleware
// Special handling for webhook route (needs raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/contact-info', contactInfoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tool Rental API is running' });
});

// Serve uploaded images (if you implement file upload later)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Tool Rental API Server is running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 Database: SQLite (rental_database.db)`);
  console.log(`\n✅ Available endpoints:`);
  console.log(`   - POST /api/auth/signup`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/google/google`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - POST /api/auth/forgot-password`);
  console.log(`   - POST /api/auth/reset-password`);
  console.log(`   - GET  /api/tools`);
  console.log(`   - GET  /api/tools/:id`);
  console.log(`   - POST /api/tools (admin)`);
  console.log(`   - PUT  /api/tools/:id (admin)`);
  console.log(`   - DELETE /api/tools/:id (admin)`);
  console.log(`   - GET  /api/tools/:id/availability`);
  console.log(`   - POST /api/reservations`);
  console.log(`   - GET  /api/reservations/my`);
  console.log(`   - GET  /api/reservations/admin/all (admin)`);
  console.log(`   - DELETE /api/reservations/:id`);
  console.log(`   - POST /api/payments/create-payment-intent`);
  console.log(`   - POST /api/payments/confirm`);
  console.log(`   - GET  /api/payments/history`);
  console.log(`\n📝 Note: Data persists in rental_database.db\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

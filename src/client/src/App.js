import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibilityButton from './components/AccessibilityButton';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ToolsCatalog from './pages/ToolsCatalog';
import ToolDetails from './pages/ToolDetails';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import UsersManagement from './pages/UsersManagement';
import OverdueTools from './pages/OverdueTools';
import ToolReservations from './pages/ToolReservations';
import RentalSettings from './pages/RentalSettings';
import ToolAvailability from './pages/ToolAvailability';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <NavBar />
            <Routes>
              <Route path="/" element={<ToolsCatalog />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/tools" element={<ToolsCatalog />} />
              <Route path="/tools/:id" element={<ToolDetails />} />
              <Route path="/availability" element={<ToolAvailability />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/overdue"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <OverdueTools />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tools/:toolId/reservations"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ToolReservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <RentalSettings />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <AccessibilityButton />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

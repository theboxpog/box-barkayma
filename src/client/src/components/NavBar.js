import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Wrench, User, LogOut, Package, ShoppingCart, Users, AlertCircle, Settings, Menu, X, Calendar, Mail } from 'lucide-react';

const NavBar = () => {
  const { user, isAuthenticated, logout, isAdmin, isAdminOrSubadmin } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-lg md:text-xl font-bold z-20" onClick={closeMobileMenu}>
            <Wrench size={24} className="md:w-7 md:h-7" />
            <span>ToolRental</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Link to="/tools" className="flex items-center space-x-1 hover:text-blue-200 transition">
              <Package size={18} />
              <span>Tools</span>
            </Link>

            <Link to="/cart" className="flex items-center space-x-1 hover:text-blue-200 relative transition">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold cart-badge-pulse shadow-lg">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-1 hover:text-blue-200 transition">
                  <Calendar size={18} />
                  <span>My Rentals</span>
                </Link>

                {/* Admin-only button */}
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition"
                  >
                    <span>Admin</span>
                  </Link>
                )}

                {/* Admin and Subadmin buttons */}
                {isAdminOrSubadmin() && (
                  <>
                    <Link
                      to="/admin/users"
                      className="flex items-center space-x-1 bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700 transition"
                    >
                      <Users size={18} />
                    </Link>
                    <Link
                      to="/admin/overdue"
                      className="flex items-center space-x-1 bg-orange-600 px-2 py-1 rounded hover:bg-orange-700 transition"
                    >
                      <AlertCircle size={18} />
                    </Link>
                  </>
                )}

                <Link to="/contact" className="flex items-center space-x-1 hover:text-blue-200 transition">
                  <Mail size={18} />
                  <span>Contact Us</span>
                </Link>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User size={18} />
                    <span className="text-sm">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 hover:text-blue-200 transition"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/contact" className="flex items-center space-x-1 hover:text-blue-200 transition">
                  <Mail size={18} />
                  <span>Contact Us</span>
                </Link>

                <Link
                  to="/login"
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Cart Icon & Menu Button */}
          <div className="flex items-center space-x-3 lg:hidden z-20">
            <Link to="/cart" className="relative" onClick={closeMobileMenu}>
              <ShoppingCart size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold cart-badge-pulse shadow-lg">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 hover:bg-blue-700 rounded transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-blue-600 shadow-lg z-10 border-t border-blue-500">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/tools"
                className="flex items-center space-x-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                onClick={closeMobileMenu}
              >
                <Package size={20} />
                <span>Tools</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <Calendar size={20} />
                    <span>My Rentals</span>
                  </Link>

                  {isAdminOrSubadmin() && (
                    <>
                      <div className="border-t border-blue-500 my-2 pt-2">
                        <p className="text-xs text-blue-200 px-3 mb-2 font-semibold">
                          {isAdmin() ? 'ADMIN' : 'STAFF'}
                        </p>
                      </div>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 py-3 px-3 bg-blue-700 rounded hover:bg-blue-800 transition"
                          onClick={closeMobileMenu}
                        >
                          <Settings size={20} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <Link
                        to="/admin/users"
                        className="flex items-center space-x-2 py-3 px-3 bg-indigo-600 rounded hover:bg-indigo-700 transition"
                        onClick={closeMobileMenu}
                      >
                        <Users size={20} />
                        <span>Users</span>
                      </Link>
                      <Link
                        to="/admin/overdue"
                        className="flex items-center space-x-2 py-3 px-3 bg-orange-600 rounded hover:bg-orange-700 transition"
                        onClick={closeMobileMenu}
                      >
                        <AlertCircle size={20} />
                        <span>Overdue</span>
                      </Link>
                    </>
                  )}

                  <Link
                    to="/contact"
                    className="flex items-center space-x-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <Mail size={20} />
                    <span>Contact Us</span>
                  </Link>

                  <div className="border-t border-blue-500 my-2 pt-2">
                    <div className="flex items-center space-x-2 py-3 px-3 text-blue-100">
                      <User size={20} />
                      <span>{user?.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 py-3 px-3 hover:bg-blue-700 rounded transition text-left"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/contact"
                    className="flex items-center space-x-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <Mail size={20} />
                    <span>Contact Us</span>
                  </Link>

                  <Link
                    to="/login"
                    className="flex items-center space-x-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <User size={20} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center space-x-2 py-3 px-3 bg-white text-blue-600 rounded hover:bg-blue-50 transition font-semibold"
                    onClick={closeMobileMenu}
                  >
                    <span className="ml-7">Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;

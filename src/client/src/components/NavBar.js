import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Wrench, User, LogOut, Package, ShoppingCart, Users, AlertCircle, Settings, Menu, X, Calendar, Mail, Globe } from 'lucide-react';

const NavBar = () => {
  const { user, isAuthenticated, logout, isAdmin, isAdminOrSubadmin } = useAuth();
  const { getCartCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

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
          <Link to="/" className="flex items-center gap-2 text-lg md:text-xl font-bold z-20" onClick={closeMobileMenu}>
            <Wrench size={24} className="md:w-7 md:h-7" />
            <span>{language === 'he' ? 'הקופסא' : 'the box'}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link to="/tools" className="flex items-center gap-1 hover:text-blue-200 transition">
              <Package size={18} />
              <span>{t('tools')}</span>
            </Link>

            <Link to="/cart" className="flex items-center gap-1 hover:text-blue-200 relative transition">
              <ShoppingCart size={18} />
              <span>{t('cart')}</span>
              {getCartCount() > 0 && (
                <span className="absolute -top-2 ltr:-right-2 rtl:-left-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold cart-badge-pulse shadow-lg">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1 hover:text-blue-200 transition">
                  <Calendar size={18} />
                  <span>{t('myRentals')}</span>
                </Link>

                {/* Admin-only button */}
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1 bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition"
                  >
                    <span>{t('admin')}</span>
                  </Link>
                )}

                {/* Admin and Subadmin buttons */}
                {isAdminOrSubadmin() && (
                  <>
                    <Link
                      to="/admin/users"
                      className="flex items-center gap-1 bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700 transition"
                    >
                      <Users size={18} />
                    </Link>
                    <Link
                      to="/admin/overdue"
                      className="flex items-center gap-1 bg-orange-600 px-2 py-1 rounded hover:bg-orange-700 transition"
                    >
                      <AlertCircle size={18} />
                    </Link>
                  </>
                )}

                <Link to="/contact" className="flex items-center gap-1 hover:text-blue-200 transition">
                  <Mail size={18} />
                  <span>{t('contactUs')}</span>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span className="text-sm">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 hover:text-blue-200 transition"
                  >
                    <LogOut size={18} />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/contact" className="flex items-center gap-1 hover:text-blue-200 transition">
                  <Mail size={18} />
                  <span>{t('contactUs')}</span>
                </Link>

                <Link
                  to="/login"
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition"
                >
                  {t('signUp')}
                </Link>
              </>
            )}

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-700 transition text-sm"
                title="Change Language"
              >
                <Globe size={16} />
                <span>{language === 'he' ? 'עב' : 'EN'}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50">
                  <button
                    onClick={() => { setLanguage('he'); setShowLangMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${language === 'he' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}
                  >
                    עברית
                  </button>
                  <button
                    onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${language === 'en' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Cart Icon & Menu Button */}
          <div className="flex items-center gap-3 lg:hidden z-20">
            {/* Mobile Language Selector */}
            <button
              onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-700 transition text-xs"
              title="Change Language"
            >
              <Globe size={16} />
              <span>{language === 'he' ? 'עב' : 'EN'}</span>
            </button>
            <Link to="/cart" className="relative flex items-center" onClick={closeMobileMenu}>
              <ShoppingCart size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 ltr:-right-2 rtl:-left-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold cart-badge-pulse shadow-lg">
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
                className="flex items-center gap-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                onClick={closeMobileMenu}
              >
                <Package size={20} />
                <span>{t('tools')}</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <Calendar size={20} />
                    <span>{t('myRentals')}</span>
                  </Link>

                  {isAdminOrSubadmin() && (
                    <>
                      <div className="border-t border-blue-500 my-2 pt-2">
                        <p className="text-xs text-blue-200 px-3 mb-2 font-semibold">
                          {isAdmin() ? t('admin').toUpperCase() : 'STAFF'}
                        </p>
                      </div>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 py-3 px-3 bg-blue-700 rounded hover:bg-blue-800 transition"
                          onClick={closeMobileMenu}
                        >
                          <Settings size={20} />
                          <span>{t('adminPanel')}</span>
                        </Link>
                      )}
                      <Link
                        to="/admin/users"
                        className="flex items-center gap-2 py-3 px-3 bg-indigo-600 rounded hover:bg-indigo-700 transition"
                        onClick={closeMobileMenu}
                      >
                        <Users size={20} />
                        <span>{t('users')}</span>
                      </Link>
                      <Link
                        to="/admin/overdue"
                        className="flex items-center gap-2 py-3 px-3 bg-orange-600 rounded hover:bg-orange-700 transition"
                        onClick={closeMobileMenu}
                      >
                        <AlertCircle size={20} />
                        <span>{t('overdue')}</span>
                      </Link>
                    </>
                  )}

                  <Link
                    to="/contact"
                    className="flex items-center gap-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <Mail size={20} />
                    <span>{t('contactUs')}</span>
                  </Link>

                  <div className="border-t border-blue-500 my-2 pt-2">
                    <div className="flex items-center gap-2 py-3 px-3 text-blue-100">
                      <User size={20} />
                      <span>{user?.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 py-3 px-3 hover:bg-blue-700 rounded transition text-start"
                    >
                      <LogOut size={20} />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/contact"
                    className="flex items-center gap-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <Mail size={20} />
                    <span>{t('contactUs')}</span>
                  </Link>

                  <Link
                    to="/login"
                    className="flex items-center gap-2 py-3 px-3 hover:bg-blue-700 rounded transition"
                    onClick={closeMobileMenu}
                  >
                    <User size={20} />
                    <span>{t('login')}</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 py-3 px-3 bg-white text-blue-600 rounded hover:bg-blue-50 transition font-semibold"
                    onClick={closeMobileMenu}
                  >
                    <span>{t('signUp')}</span>
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

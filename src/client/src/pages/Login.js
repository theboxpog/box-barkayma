import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import WelcomeModal from '../components/WelcomeModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  const [signupMessage, setSignupMessage] = useState('');
  const { login, googleLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch signup message for welcome modal (in case of new Google user)
    const fetchSignupMessage = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/contact-info');
        setSignupMessage(response.data.signup_message);
      } catch (err) {
        console.error('Failed to fetch signup message:', err);
        setSignupMessage('Welcome to our Tool Rental service! We are excited to have you on board.');
      }
    };
    fetchSignupMessage();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    // First check if user exists (without creating)
    const result = await googleLogin(credentialResponse.credential, false);

    if (result.success) {
      // Existing user - logged in successfully
      navigate('/');
    } else if (result.needsPrivacyAcceptance) {
      // New user - show privacy policy modal
      setPendingGoogleCredential(credentialResponse.credential);
      setShowPrivacyModal(true);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handlePrivacyAccept = async () => {
    setShowPrivacyModal(false);
    setLoading(true);

    // Now create the user (with createIfNotExists: true)
    const result = await googleLogin(pendingGoogleCredential, true);
    setPendingGoogleCredential(null);

    if (result.success) {
      // Show welcome modal for new users
      setShowWelcomeModal(true);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    setPendingGoogleCredential(null);
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    navigate('/');
  };

  const handleGoogleError = () => {
    setError('Google sign in failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <LogIn className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('login')}</h2>
          <p className="mt-2 text-gray-600">{t('signInToAccount')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('orContinueWith')}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600">
          {t('dontHaveAccount')}{' '}
          <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            {t('signUp')}
          </Link>
        </p>
      </div>

      {showPrivacyModal && (
        <PrivacyPolicyModal
          onAccept={handlePrivacyAccept}
          onDecline={handlePrivacyDecline}
        />
      )}

      {showWelcomeModal && (
        <WelcomeModal
          message={signupMessage}
          onClose={handleCloseWelcomeModal}
        />
      )}
    </div>
  );
};

export default Login;

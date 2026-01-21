import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import WelcomeModal from '../components/WelcomeModal';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  const [signupMessage, setSignupMessage] = useState('');
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch signup message from API
    const fetchSignupMessage = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/contact-info');
        setSignupMessage(response.data.signup_message);
      } catch (err) {
        console.error('Failed to fetch signup message:', err);
        // Use default message if fetch fails
        setSignupMessage('Welcome to our Tool Rental service! We are excited to have you on board.');
      }
    };
    fetchSignupMessage();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Show privacy policy modal before signup
    setShowPrivacyModal(true);
  };

  const handlePrivacyAccept = async () => {
    setShowPrivacyModal(false);
    setLoading(true);

    // Check if this is a Google signup or regular signup
    if (pendingGoogleCredential) {
      const result = await googleLogin(pendingGoogleCredential);
      setPendingGoogleCredential(null);

      if (result.success) {
        setShowWelcomeModal(true);
      } else {
        setError(result.error);
      }
    } else {
      const result = await signup(formData.name, formData.email, formData.phone_number, formData.password);

      if (result.success) {
        setShowWelcomeModal(true);
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    setPendingGoogleCredential(null);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    // Store the credential and show privacy modal
    setPendingGoogleCredential(credentialResponse.credential);
    setShowPrivacyModal(true);
  };

  const handleGoogleError = () => {
    setError('Google sign up failed. Please try again.');
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Sign Up</h2>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0501234567"
            />
            <p className="text-xs text-gray-500 mt-1">Enter 10-15 digits</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Login
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-500">
          By signing up, you agree to our{' '}
          <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
            Privacy Policy
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

export default Signup;

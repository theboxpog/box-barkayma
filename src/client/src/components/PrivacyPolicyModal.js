import React, { useState, useEffect } from 'react';
import { X, Shield, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';

const PrivacyPolicyModal = ({ onAccept, onDecline }) => {
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/contact-info');
        setPrivacyPolicy(response.data.privacy_policy || getDefaultPrivacyPolicy());
      } catch (err) {
        console.error('Failed to fetch privacy policy:', err);
        setPrivacyPolicy(getDefaultPrivacyPolicy());
      } finally {
        setLoading(false);
      }
    };
    fetchPrivacyPolicy();
  }, []);

  const getDefaultPrivacyPolicy = () => {
    return `Privacy Policy

Information We Collect
We collect information you provide directly to us, such as when you create an account, make a reservation, or contact us.

How We Use Your Information
We use the information we collect to:
- Process your reservations
- Send you confirmation emails
- Improve our services
- Communicate with you

Data Security
We implement industry-standard security measures to protect your personal information.

Your Rights
You have the right to access, correct, or delete your personal data at any time.

Contact Us
If you have any questions about this Privacy Policy, please contact us.`;
  };

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Shield size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Privacy Policy</h2>
          </div>
          <button
            onClick={onDecline}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
              {privacyPolicy}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Checkbox */}
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <button
              type="button"
              onClick={() => setAccepted(!accepted)}
              className="mt-0.5 flex-shrink-0"
            >
              {accepted ? (
                <CheckSquare size={24} className="text-blue-600" />
              ) : (
                <Square size={24} className="text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700">
              I have read and agree to the Privacy Policy. I understand how my personal information will be collected, used, and protected.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                accepted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;

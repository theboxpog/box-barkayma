import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { Calendar, Check, Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';

const RentalSettings = () => {
  const [allowedDays, setAllowedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: '',
    signup_message: '',
    privacy_policy: '',
    email_important_message: ''
  });
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    fetchSettings();
    fetchContactInfo();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getRentalDays();
      setAllowedDays(response.data.allowedDays);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/contact-info');
      setContactInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch contact info:', err);
      setContactError('Failed to load contact information');
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({ ...prev, [name]: value }));
    setContactError('');
  };

  const handleSaveContact = async () => {
    // Validation
    if (!contactInfo.email || !contactInfo.phone || !contactInfo.address) {
      setContactError('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      setContactError('Invalid email format');
      return;
    }

    try {
      setSavingContact(true);
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/contact-info', contactInfo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContactSuccess('Contact information updated successfully!');
      setContactError('');

      setTimeout(() => setContactSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save contact info:', err);
      setContactError(err.response?.data?.error || 'Failed to update contact information');
    } finally {
      setSavingContact(false);
    }
  };

  const handleDayToggle = (dayValue) => {
    setAllowedDays(prev => {
      if (prev.includes(dayValue)) {
        // Remove day
        const newDays = prev.filter(d => d !== dayValue);
        // Prevent removing all days
        if (newDays.length === 0) {
          setError('At least one day must be allowed');
          return prev;
        }
        return newDays;
      } else {
        // Add day
        return [...prev, dayValue].sort((a, b) => a - b);
      }
    });
    setError(null);
  };

  const handleSave = async () => {
    if (allowedDays.length === 0) {
      setError('At least one day must be allowed');
      return;
    }

    try {
      setSaving(true);
      await settingsAPI.updateRentalDays(allowedDays);
      setSuccessMessage('Settings saved successfully!');
      setError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Rental Day Settings</h1>
        </div>
        <p className="text-gray-600">
          Configure which days of the week customers can start and end their rentals.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <Check size={20} />
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Allowed Rental Days</h2>
        <p className="text-gray-600 mb-6">
          Select the days when customers can pick up and return tools:
        </p>

        <div className="space-y-3 mb-6">
          {daysOfWeek.map((day) => (
            <label
              key={day.value}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={allowedDays.includes(day.value)}
                onChange={() => handleDayToggle(day.value)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-lg text-gray-800 font-medium">
                {day.label}
              </span>
              {allowedDays.includes(day.value) && (
                <Check size={20} className="ml-auto text-green-600" />
              )}
            </label>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Current selection:</strong> Rentals allowed on{' '}
            {allowedDays.length === 7 ? (
              <span className="font-semibold">all days of the week</span>
            ) : allowedDays.length === 0 ? (
              <span className="font-semibold text-red-600">no days (invalid)</span>
            ) : (
              <span className="font-semibold">
                {allowedDays.map(d => daysOfWeek.find(day => day.value === d)?.label).join(', ')}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || allowedDays.length === 0}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Changes will affect new bookings immediately. Existing reservations will not be affected.
        </p>
      </div>

      {/* Contact Information Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail size={24} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Update the contact information displayed on the Contact Us page.
        </p>

        {contactError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {contactError}
          </div>
        )}

        {contactSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
            <Check size={20} />
            {contactSuccess}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={contactInfo.email}
              onChange={handleContactChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@toolrental.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={contactInfo.phone}
              onChange={handleContactChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+972 50-123-4567"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} />
              Address
            </label>
            <textarea
              name="address"
              value={contactInfo.address}
              onChange={handleContactChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Tool Street, Tel Aviv, Israel"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can use line breaks for multi-line addresses
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Signup Welcome Message
            </label>
            <textarea
              name="signup_message"
              value={contactInfo.signup_message}
              onChange={handleContactChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Welcome to our Tool Rental service! We are excited to have you on board."
            />
            <p className="text-sm text-gray-500 mt-1">
              This message will be displayed to users after they successfully sign up
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Privacy Policy Content (Markdown Supported)
            </label>
            <textarea
              name="privacy_policy"
              value={contactInfo.privacy_policy || ''}
              onChange={handleContactChange}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Enter privacy policy in Markdown format..."
            />
            <p className="text-sm text-gray-500 mt-1">
              This content will be displayed on the Privacy Policy page. You can use Markdown formatting.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail size={20} className="text-orange-500" />
              Email Settings
            </h3>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} />
                Important Message for Confirmation Emails
              </label>
              <textarea
                name="email_important_message"
                value={contactInfo.email_important_message || ''}
                onChange={handleContactChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter an important message that will appear in reservation confirmation emails (e.g., special instructions, pickup hours, etc.)"
              />
              <p className="text-sm text-gray-500 mt-1">
                This message will be highlighted in reservation confirmation emails. Leave empty to hide this section.
              </p>
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The contact details (email, phone, address) above will also be included in the confirmation emails automatically.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveContact}
            disabled={savingContact}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {savingContact ? 'Saving...' : 'Save Contact Information'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalSettings;

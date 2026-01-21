import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, UserCheck, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PrivacyPolicy = () => {
  const [customPolicy, setCustomPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/contact-info');
      if (response.data.privacy_policy) {
        setCustomPolicy(response.data.privacy_policy);
      }
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If there's a custom policy, render it
  if (customPolicy) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Shield className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          </div>
          <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
            {customPolicy}
          </div>
        </div>
      </div>
    );
  }

  // Default hardcoded policy
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last Updated: December 24, 2025</p>
        </div>

        {/* Introduction */}
        <div className="mb-8">
          <p className="text-gray-700 leading-relaxed">
            Welcome to our Tool Rental Service. We are committed to protecting your privacy and ensuring
            the security of your personal information. This Privacy Policy explains how we collect, use,
            store, and protect your data in accordance with Israeli privacy laws and international best practices.
          </p>
        </div>

        {/* Information We Collect */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1.1 Account Information</h3>
              <p className="text-gray-700 mb-2">When you create an account, we collect:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Password (encrypted)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1.2 Google Authentication</h3>
              <p className="text-gray-700">
                If you sign up using Google OAuth, we receive your name, email address, and profile
                information from Google. We do not store your Google password.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1.3 Rental Information</h3>
              <p className="text-gray-700 mb-2">When you rent tools, we collect:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Tool rental history</li>
                <li>Rental dates and duration</li>
                <li>Delivery or pickup preferences</li>
                <li>Payment information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1.4 Technical Information</h3>
              <p className="text-gray-700 mb-2">We automatically collect:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Usage data and preferences</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
          </div>

          <div className="ml-9">
            <p className="text-gray-700 mb-3">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Create and manage your account</li>
              <li>Process tool rentals and reservations</li>
              <li>Send rental confirmations and reminders</li>
              <li>Process payments and issue invoices</li>
              <li>Communicate about your rentals and account</li>
              <li>Send important service updates and notifications</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>
        </section>

        {/* Data Storage and Security */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">3. Data Storage and Security</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 Security Measures</h3>
              <p className="text-gray-700 mb-2">We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Encrypted password storage using bcrypt</li>
                <li>Secure HTTPS connections</li>
                <li>JWT token-based authentication</li>
                <li>Regular security audits</li>
                <li>Access controls and authentication</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3.2 Data Retention</h3>
              <p className="text-gray-700">
                We retain your personal information for as long as your account is active or as needed
                to provide services. You may request deletion of your account at any time. However, we
                may retain certain information for legal compliance, dispute resolution, and fraud prevention.
              </p>
            </div>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">4. Third-Party Services</h2>
          </div>

          <div className="ml-9 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Google OAuth</h3>
              <p className="text-gray-700">
                When you sign in with Google, we use Google's OAuth 2.0 authentication service.
                Google's Privacy Policy applies to the information they collect. We only receive
                basic profile information that you authorize.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">4.2 Analytics and Cookies</h3>
              <p className="text-gray-700">
                We may use cookies and similar tracking technologies to enhance your experience,
                analyze usage patterns, and improve our services. You can control cookie preferences
                through your browser settings.
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">5. Your Rights</h2>
          </div>

          <div className="ml-9">
            <p className="text-gray-700 mb-3">Under Israeli privacy laws, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain data processing activities</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">6. Information Sharing</h2>
          </div>

          <div className="ml-9">
            <p className="text-gray-700 mb-3">We do not sell your personal information. We may share your data only in these circumstances:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">7. Children's Privacy</h2>
          </div>

          <div className="ml-9">
            <p className="text-gray-700">
              Our service is not intended for individuals under 18 years of age. We do not knowingly
              collect personal information from children. If you believe we have inadvertently collected
              information from a minor, please contact us immediately.
            </p>
          </div>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">8. Changes to This Policy</h2>
          </div>

          <div className="ml-9">
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the new policy on this page and updating the "Last Updated" date.
              We encourage you to review this policy periodically.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">9. Contact Us</h2>
          </div>

          <div className="ml-9">
            <p className="text-gray-700 mb-3">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700"><strong>Email:</strong> privacy@toolrental.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> +972 50-123-4567</p>
              <p className="text-gray-700"><strong>Address:</strong> 123 Tool Street, Tel Aviv, Israel</p>
            </div>
          </div>
        </section>

        {/* Consent */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-700 text-center">
            By using our Tool Rental Service, you acknowledge that you have read and understood this
            Privacy Policy and agree to the collection, use, and disclosure of your information as
            described herein.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

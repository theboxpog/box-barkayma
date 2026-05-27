import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { contactInfoAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const [contactInfo, setContactInfo] = useState({
    email: 'contact@toolrental.com',
    phone: '+972 50-123-4567',
    address: '123 Tool Street, Tel Aviv, Israel'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await contactInfoAPI.get();
      setContactInfo(response.data);
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('contactUs')}</h1>
            <p className="text-lg text-gray-600">
              {t('contactUsSubtitle')}
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('getInTouch')}</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-brand-100 rounded-full p-3">
                  <Mail className="text-brand-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{t('email')}</h3>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-brand-600 hover:text-brand-800"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brand-100 rounded-full p-3">
                  <Phone className="text-brand-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{t('phone')}</h3>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                    className="text-brand-600 hover:text-brand-800"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brand-100 rounded-full p-3">
                  <MapPin className="text-brand-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{t('address')}</h3>
                  <p className="text-gray-600" style={{ whiteSpace: 'pre-line' }}>
                    {contactInfo.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Policy Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <Link
                to="/privacy-policy"
                className="text-brand-600 hover:text-brand-800 text-sm underline"
              >
                {t('viewPrivacyPolicy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

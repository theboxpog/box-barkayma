import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Clock, DollarSign, ArrowRight, Search, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-10 text-blue-100 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Link
                to="/tools"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg"
              >
                <Search size={22} />
                {t('browseTools')}
              </Link>
              <Link
                to="/availability"
                className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-400 transition border-2 border-blue-400 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg"
              >
                <Calendar size={22} />
                {t('checkAvailability')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100+</div>
              <div className="text-sm text-gray-600">{t('tools')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-600">{t('flexibleRental')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">₪15</div>
              <div className="text-sm text-gray-600">{t('perDay')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">⭐ 5</div>
              <div className="text-sm text-gray-600">{t('qualityTools')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('whyChooseUs')}</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">{t('heroSubtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-center group">
            <div className="bg-blue-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
              <Wrench className="h-10 w-10 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t('qualityTools')}</h3>
            <p className="text-gray-600">
              {t('qualityToolsDesc')}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-center group">
            <div className="bg-blue-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
              <Clock className="h-10 w-10 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t('flexibleRental')}</h3>
            <p className="text-gray-600">
              {t('flexibleRentalDesc')}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-center group">
            <div className="bg-blue-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
              <DollarSign className="h-10 w-10 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t('affordablePrices')}</h3>
            <p className="text-gray-600">
              {t('affordablePricesDesc')}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-center group">
            <div className="bg-blue-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
              <Shield className="h-10 w-10 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t('securePayment')}</h3>
            <p className="text-gray-600">
              {t('securePaymentDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-b from-gray-100 to-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('howItWorks')}</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">{t('step1Desc')}</p>

          <div className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 max-w-5xl mx-auto ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="text-center flex-1 relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('step1Title')}</h3>
              <p className="text-gray-600 max-w-xs mx-auto">
                {t('step1Desc')}
              </p>
            </div>

            <div className={`hidden md:block text-blue-400 ${isRTL ? 'rotate-180' : ''}`}>
              <ArrowRight size={40} />
            </div>

            <div className="text-center flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('step2Title')}</h3>
              <p className="text-gray-600 max-w-xs mx-auto">
                {t('step2Desc')}
              </p>
            </div>

            <div className={`hidden md:block text-blue-400 ${isRTL ? 'rotate-180' : ''}`}>
              <ArrowRight size={40} />
            </div>

            <div className="text-center flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('step3Title')}</h3>
              <p className="text-gray-600 max-w-xs mx-auto">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('readyToStart')}</h2>
          <p className="text-lg md:text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            {t('joinThousands')}
          </p>
          <Link
            to="/tools"
            className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold hover:bg-blue-50 transition inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
          >
            {t('viewAllTools')}
            <ArrowRight size={22} className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

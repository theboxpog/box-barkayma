import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Loader, XCircle } from 'lucide-react';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'success') {
      navigate('/checkout/success', {
        state: { orderCount: 0, totalAmount: 0, reservations: [] }
      });
    }
  }, [status, navigate]);

  if (status !== 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <XCircle size={64} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'he' ? 'שגיאה בתשלום' : 'Payment Error'}
          </h1>
          <p className="text-gray-600 mb-6">
            {language === 'he' ? 'התשלום נכשל. אנא נסה שוב.' : 'Payment failed. Please try again.'}
          </p>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
          >
            {language === 'he' ? 'חזור לתשלום' : 'Back to Checkout'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
        <Loader size={64} className="mx-auto text-blue-600 mb-4 animate-spin" />
        <p className="text-gray-600">
          {language === 'he' ? 'אנא המתן...' : 'Please wait...'}
        </p>
      </div>
    </div>
  );
};

export default PaymentCallback;

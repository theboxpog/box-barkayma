import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { paymentsAPI } from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const BitCallback = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Read Sumit redirect parameters (handle both upper and lowercase)
      const paymentId = searchParams.get('OG-PaymentID') || searchParams.get('og-paymentid');
      const externalIdentifier = searchParams.get('OG-ExternalIdentifier') || searchParams.get('og-externalidentifier');

      // Get saved pending order data
      const pendingOrderStr = localStorage.getItem('pendingBitOrder');
      const pendingOrder = pendingOrderStr ? JSON.parse(pendingOrderStr) : null;

      // Use externalIdentifier from URL or from localStorage
      const identifier = externalIdentifier || pendingOrder?.identifier;

      if (!paymentId || !identifier) {
        setStatus('error');
        setError(language === 'he' ? 'פרטי תשלום חסרים' : 'Missing payment details');
        return;
      }

      if (!isAuthenticated) {
        setStatus('error');
        setError(language === 'he' ? 'יש להתחבר כדי להשלים את ההזמנה' : 'Please log in to complete the order');
        return;
      }

      try {
        const response = await paymentsAPI.bitVerify({
          paymentId,
          externalIdentifier: identifier
        });

        if (response.data.success) {
          setStatus('success');
          setOrderDetails({
            reservations: response.data.reservations,
            paymentId: response.data.paymentId,
            totalAmount: pendingOrder?.totalAmount
          });
          clearCart();
          localStorage.removeItem('pendingBitOrder');
        } else {
          setStatus('error');
          setError(response.data.error || (language === 'he' ? 'אימות התשלום נכשל' : 'Payment verification failed'));
        }
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.error || (language === 'he' ? 'שגיאה באימות התשלום' : 'Payment verification error'));
      }
    };

    verifyPayment();
  }, []);

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <Loader className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {language === 'he' ? 'מאמת תשלום...' : 'Verifying payment...'}
          </h2>
          <p className="text-gray-600">
            {language === 'he' ? 'אנא המתן בזמן שאנו מאשרים את התשלום שלך' : 'Please wait while we confirm your payment'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <XCircle className="mx-auto text-red-600 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-800 mb-2">
            {language === 'he' ? 'התשלום נכשל' : 'Payment Failed'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-semibold"
          >
            {language === 'he' ? 'חזרה לתשלום' : 'Back to Checkout'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
        <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-green-800 mb-2">
          {language === 'he' ? 'התשלום בוצע בהצלחה!' : 'Payment Successful!'}
        </h2>
        <p className="text-gray-600 mb-2">
          {language === 'he' ? 'ההזמנה שלך אושרה' : 'Your order has been confirmed'}
        </p>
        {orderDetails?.totalAmount && (
          <p className="text-2xl font-bold text-blue-600 mb-4">
            ₪{orderDetails.totalAmount.toFixed(2)}
          </p>
        )}
        {orderDetails?.reservations && (
          <div className="text-sm text-gray-600 mb-6">
            <p>{orderDetails.reservations.length} {language === 'he' ? 'פריטים הוזמנו' : 'items reserved'}</p>
          </div>
        )}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 font-semibold"
          >
            {language === 'he' ? 'צפה בהזמנות שלי' : 'View My Orders'}
          </button>
          <button
            onClick={() => navigate('/tools')}
            className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 font-semibold"
          >
            {language === 'he' ? 'המשך לגלוש' : 'Continue Browsing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitCallback;

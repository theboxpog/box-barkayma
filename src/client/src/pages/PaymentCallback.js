import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { paymentsAPI } from '../services/api';
import { Loader, XCircle, CheckCircle } from 'lucide-react';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const status = searchParams.get('status');
  const identifier = searchParams.get('id');
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);
  const didRun = useRef(false); // prevent React StrictMode double-invocation

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // Payment was cancelled or failed — signal the original tab and clear pending order
    if (status !== 'success') {
      localStorage.removeItem('pendingBitOrder');
      localStorage.setItem('paymentFailed', 'true');
      return;
    }

    if (!identifier) {
      setErrorMsg(language === 'he' ? 'מזהה תשלום חסר.' : 'Missing payment identifier.');
      return;
    }

    const confirmOrder = async () => {
      try {
        const response = await paymentsAPI.complete(identifier);

        const pending = JSON.parse(localStorage.getItem('pendingBitOrder') || 'null');
        if (pending?.userId) localStorage.removeItem(`cart_${pending.userId}`);
        localStorage.removeItem('pendingBitOrder');
        clearCart();

        const successData = {
          orderCount: response.data.orderCount,
          totalAmount: response.data.totalAmount,
          reservations: response.data.reservations
        };

        // Signal the original checkout tab that payment is complete
        localStorage.setItem('paymentComplete', JSON.stringify(successData));

        setDone(true);
        navigate('/checkout/success', { state: successData });
      } catch (err) {
        console.error('Failed to confirm order:', err);
        const serverMsg = err.response?.data?.error;
        const networkMsg = err.message;
        const msg = serverMsg ||
          (language === 'he'
            ? `שגיאה ביצירת ההזמנה: ${networkMsg || 'שגיאה לא ידועה'}. אנא צור קשר עם התמיכה.`
            : `Failed to create reservation: ${networkMsg || 'Unknown error'}. Please contact support.`);
        localStorage.setItem('paymentError', msg);
        setErrorMsg(msg);
      }
    };

    confirmOrder();
  }, [status, identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status !== 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <XCircle size={64} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'he' ? 'התשלום בוטל' : 'Payment Cancelled'}
          </h1>
          <p className="text-gray-600 mb-6">
            {language === 'he' ? 'התשלום לא הושלם. אנא נסה שוב.' : 'The payment was not completed. Please try again.'}
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

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <XCircle size={64} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'he' ? 'שגיאה באישור ההזמנה' : 'Order Confirmation Error'}
          </h1>
          <p className="text-gray-600 mb-2">
            {language === 'he'
              ? 'התשלום התקבל אך אירעה שגיאה ביצירת ההזמנה.'
              : 'Payment was received but there was an error creating your reservation.'}
          </p>
          <p className="text-red-600 text-sm mb-6">{errorMsg}</p>
          <p className="text-gray-500 text-sm mb-6">
            {language === 'he'
              ? 'אנא צור קשר עם התמיכה ותציין שהתשלום בוצע.'
              : 'Please contact support and mention that your payment was completed.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
          >
            {language === 'he' ? 'חזור לדף הבית' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
        {done ? (
          <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
        ) : (
          <Loader size={64} className="mx-auto text-blue-600 mb-4 animate-spin" />
        )}
        <p className="text-gray-700 font-medium">
          {language === 'he' ? 'מאשר את ההזמנה שלך...' : 'Confirming your order...'}
        </p>
      </div>
    </div>
  );
};

export default PaymentCallback;

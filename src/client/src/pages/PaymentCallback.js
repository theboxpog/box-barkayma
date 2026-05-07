import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { reservationsAPI } from '../services/api';
import { Loader, XCircle, CheckCircle } from 'lucide-react';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const status = searchParams.get('status');
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status !== 'success') return;

    const pending = JSON.parse(localStorage.getItem('pendingBitOrder') || 'null');

    if (!pending || !pending.cartItems || pending.cartItems.length === 0) {
      navigate('/checkout/success', {
        state: { orderCount: 0, totalAmount: 0, reservations: [] }
      });
      return;
    }

    const createReservations = async () => {
      try {
        const reservationsToCreate = pending.cartItems.map(item => ({
          tool_id: item.toolId,
          start_date: item.startDate,
          end_date: item.endDate,
          quantity: item.quantity,
          total_price: item.totalPrice
        }));

        const batchResponse = await reservationsAPI.createBatch(reservationsToCreate);

        if (pending.userId) localStorage.removeItem(`cart_${pending.userId}`);
        localStorage.removeItem('pendingBitOrder');
        clearCart();
        setDone(true);

        navigate('/checkout/success', {
          state: {
            orderCount: pending.cartItems.length,
            totalAmount: pending.totalAmount,
            reservations: batchResponse.data.reservations
          }
        });
      } catch (err) {
        console.error('Failed to create reservations:', err);
        const msg = err.response?.data?.error ||
          (language === 'he' ? 'שגיאה ביצירת ההזמנה. אנא צור קשר עם התמיכה.' : 'Failed to create reservation. Please contact support.');
        setErrorMsg(msg);
      }
    };

    createReservations();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

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

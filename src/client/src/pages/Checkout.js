import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { reservationsAPI, paymentsAPI, couponsAPI, authAPI } from '../services/api';
import { CreditCard, Package, Calendar, CheckCircle, Loader, Tag, X, Phone, Lock } from 'lucide-react';

const Checkout = () => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { isAuthenticated, user, updateUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
  const [savingPhoneNumber, setSavingPhoneNumber] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.phone_number) {
        setNeedsPhoneNumber(true);
      } else {
        setPhoneNumber(user.phone_number);
        setNeedsPhoneNumber(false);
      }
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const orderTotal = getCartTotal();
      const cartItemsForValidation = cartItems.map(item => ({
        toolId: item.toolId,
        category: item.toolCategory,
        toolName: item.toolName,
        totalPrice: item.totalPrice
      }));
      const response = await couponsAPI.validate(couponCode.trim(), orderTotal, cartItemsForValidation);
      if (response.data.valid) {
        setAppliedCoupon(response.data);
        setCouponCode('');
        setCouponError('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const getFinalTotal = () => {
    const cartTotal = getCartTotal();
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.finalPrice);
    }
    return cartTotal;
  };

  const getDiscountAmount = () => {
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.discountAmount);
    }
    return 0;
  };

  const handleSavePhoneNumber = async () => {
    if (!phoneNumber || !phoneNumber.trim()) {
      setError('Please enter a phone number');
      return false;
    }
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      setError('Phone number must be 10-15 digits');
      return false;
    }
    setSavingPhoneNumber(true);
    setError('');
    try {
      await authAPI.updateProfile({ phone_number: cleanedPhone });
      updateUser({ phone_number: cleanedPhone });
      setPhoneNumber(cleanedPhone);
      setNeedsPhoneNumber(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save phone number');
      return false;
    } finally {
      setSavingPhoneNumber(false);
    }
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      setError(language === 'he' ? 'העגלה ריקה' : 'Cart is empty');
      return;
    }
    if (needsPhoneNumber) {
      setError(language === 'he' ? 'אנא הוסף את מספר הטלפון שלך לפני התשלום' : 'Please add your phone number before checkout');
      return;
    }
    if (!phoneNumber) {
      setError(language === 'he' ? 'מספר טלפון נדרש לתשלום' : 'Phone number is required for checkout');
      return;
    }
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setError(language === 'he' ? 'מספר טלפון חייב להכיל 10-15 ספרות' : 'Phone number must be 10-15 digits');
      return;
    }

    const finalTotal = getFinalTotal();

    if (finalTotal <= 0) {
      await processOrderWithoutPayment();
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Save pending order BEFORE calling server, so it's ready when we return
      localStorage.setItem('pendingBitOrder', JSON.stringify({
        cartItems: cartItems.map(item => ({ ...item })),
        totalAmount: finalTotal,
        userId: user?.id
      }));

      const response = await paymentsAPI.bitInit({
        amount: finalTotal,
        description: `The Box - Tool Rental`,
        customerName: user?.name || user?.email?.split('@')[0] || 'Customer',
        customerEmail: user?.email,
        customerPhone: phoneNumber
      });

      if (!response.data.success || !response.data.redirectUrl) {
        localStorage.removeItem('pendingBitOrder');
        setError(response.data.error || (language === 'he' ? 'שגיאה באתחול תשלום' : 'Failed to initialize payment'));
        setProcessing(false);
        return;
      }

      // Redirect user to SUMIT's payment page (full redirect — payment happens on SUMIT's site)
      window.location.href = response.data.redirectUrl;

    } catch (err) {
      localStorage.removeItem('pendingBitOrder');
      const errMsg = err.response?.data?.error ||
                     (language === 'he' ? 'שגיאה בתהליך התשלום' : 'Payment initialization failed');
      setError(errMsg);
      setProcessing(false);
    }
  };

  const processOrderWithoutPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const reservationsToCreate = cartItems.map(item => ({
        tool_id: item.toolId,
        start_date: item.startDate,
        end_date: item.endDate,
        quantity: item.quantity,
        total_price: item.totalPrice
      }));
      const batchResponse = await reservationsAPI.createBatch(reservationsToCreate);
      const createdReservations = batchResponse.data.reservations;
      clearCart();
      navigate('/checkout/success', {
        state: {
          orderCount: cartItems.length,
          totalAmount: 0,
          reservations: createdReservations
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('yourCartEmpty')}</h1>
            <p className="text-gray-600 mb-8">{t('cartEmptyMessage')}</p>
            <button
              onClick={() => navigate('/tools')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
            >
              {t('browseTools')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('checkoutTitle')}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('orderSummary')}</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.toolName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <Calendar className="inline mr-1" size={14} />
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.days} {item.days === 1 ? t('day') : t('days')} × {item.quantity} {item.quantity === 1 ? t('tool') : t('toolsLower')} × ₪{item.pricePerDay}/{t('day')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">₪{item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <CreditCard className="mr-2" size={24} />
                  {t('paymentInfo')}
                </h2>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
                    {error}
                  </div>
                )}

                {/* Phone Number Section */}
                {needsPhoneNumber && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start mb-3">
                      <Phone className="text-yellow-600 mr-2 mt-1" size={20} />
                      <div>
                        <h3 className="text-sm font-semibold text-yellow-800">{t('phoneRequired')}</h3>
                        <p className="text-xs text-yellow-700 mt-1">{t('phoneRequiredMessage')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                        placeholder={t('phoneNumber')}
                        className="flex-1 px-4 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <button
                        type="button"
                        onClick={handleSavePhoneNumber}
                        disabled={savingPhoneNumber}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 font-semibold flex items-center"
                      >
                        {savingPhoneNumber ? (
                          <>
                            <Loader className="animate-spin mr-2" size={16} />
                            {t('loading')}
                          </>
                        ) : (
                          t('save')
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!needsPhoneNumber && phoneNumber && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone className="text-green-600 mr-2" size={18} />
                        <div>
                          <span className="text-sm font-medium text-green-800">{t('contactNumber')}: </span>
                          <span className="text-sm text-green-700">{phoneNumber}</span>
                        </div>
                      </div>
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                  </div>
                )}

                {getFinalTotal() > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Lock className="text-blue-600 mr-2" size={20} />
                      <span className="text-sm font-semibold text-blue-800">
                        {language === 'he' ? 'תשלום מאובטח באמצעות SUMIT' : 'Secure payment powered by SUMIT'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {language === 'he'
                        ? 'תועבר לדף תשלום מאובטח של SUMIT. ניתן לשלם בכרטיס אשראי או בביט.'
                        : 'You will be redirected to a secure SUMIT payment page. Pay by credit card or BIT.'}
                    </p>
                  </div>
                )}

                {getFinalTotal() <= 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="mx-auto text-green-600 mb-3" size={48} />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">{t('noPaymentRequired')}</h3>
                    <p className="text-sm text-green-700">{t('couponCoversAll')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Total */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('orderTotal')}</h2>

                {/* Coupon Input */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('haveCoupon')}
                  </label>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder={t('enterCode')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold flex items-center"
                        >
                          {validatingCoupon ? (
                            <Loader className="animate-spin" size={16} />
                          ) : (
                            t('apply')
                          )}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-600">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Tag size={16} className="text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            {appliedCoupon.coupon.code}
                          </span>
                          <span className="text-xs text-green-600">
                            ({appliedCoupon.coupon.discount_type === 'percentage'
                              ? `${appliedCoupon.coupon.discount_value}% ${t('off')}`
                              : `₪${appliedCoupon.coupon.discount_value} ${t('off')}`})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {appliedCoupon.appliedToMessage && (
                        <p className="text-xs text-green-700 mt-1">
                          {appliedCoupon.appliedToMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('subtotal')} ({cartItems.length} {t('items')})</span>
                    <span>₪{getCartTotal().toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('discount')} ({appliedCoupon.coupon.code})</span>
                      <span>-₪{getDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>{t('tax')}</span>
                    <span>₪0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">{t('total')}</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₪{getFinalTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      <span>{t('processing')}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      <span>
                        {getFinalTotal() <= 0
                          ? t('placeOrder')
                          : (language === 'he' ? `לתשלום ₪${getFinalTotal().toFixed(2)}` : `Pay ₪${getFinalTotal().toFixed(2)}`)}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="w-full mt-3 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 font-semibold"
                >
                  {t('backToCart')}
                </button>

                <div className="mt-6 text-xs text-gray-500">
                  <p className="mb-2">{t('termsMessage')}</p>
                  <p>{t('returnMessage')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

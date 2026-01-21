import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { reservationsAPI, paymentsAPI, couponsAPI, authAPI, toolsAPI } from '../services/api';
import { CreditCard, Package, Calendar, DollarSign, CheckCircle, Loader, Tag, X, Phone } from 'lucide-react';

const Checkout = () => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
  const [savingPhoneNumber, setSavingPhoneNumber] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Check if user has phone number on component mount
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo({
      ...paymentInfo,
      [name]: value
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const orderTotal = getCartTotal();
      // Prepare cart items with necessary info for validation
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

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Calculate final total with discount
  const getFinalTotal = () => {
    const cartTotal = getCartTotal();
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.finalPrice);
    }
    return cartTotal;
  };

  // Get discount amount
  const getDiscountAmount = () => {
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.discountAmount);
    }
    return 0;
  };

  // Save phone number to user profile
  const handleSavePhoneNumber = async () => {
    if (!phoneNumber || !phoneNumber.trim()) {
      setError('Please enter a phone number');
      return false;
    }

    // Clean phone number (remove non-digits)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');

    // Validate phone number format (digits only)
    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      setError('Phone number must be 10-15 digits');
      return false;
    }

    setSavingPhoneNumber(true);
    setError('');

    try {
      const response = await authAPI.updateProfile({ phone_number: cleanedPhone });
      // Update user in AuthContext
      updateUser({ phone_number: cleanedPhone });
      setPhoneNumber(cleanedPhone); // Update the display to show cleaned number
      setNeedsPhoneNumber(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save phone number');
      return false;
    } finally {
      setSavingPhoneNumber(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // Check if phone number is required
    if (needsPhoneNumber) {
      setError('Please add your phone number before checkout');
      return;
    }

    // Validate phone number (count only digits)
    if (!phoneNumber) {
      setError('Phone number is required for checkout');
      return;
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setError('Phone number must be 10-15 digits');
      return;
    }

    // Basic validation - only require payment info if total is greater than 0
    const finalTotal = getFinalTotal();
    if (finalTotal > 0 && (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.expiryDate || !paymentInfo.cvv)) {
      setError('Please fill in all payment information');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Pre-checkout validation: Check availability for all items accounting for cart quantities
      // Group cart items by tool and date range to calculate total quantity per tool
      const toolAvailabilityChecks = [];
      const processedItems = new Set();

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const itemKey = `${item.toolId}_${item.startDate}_${item.endDate}`;

        // Skip if we already checked this tool+date combination
        if (processedItems.has(itemKey)) continue;
        processedItems.add(itemKey);

        // Calculate total quantity for this tool across all cart items with overlapping dates
        const totalCartQuantity = cartItems
          .filter(cartItem => {
            if (cartItem.toolId !== item.toolId) return false;
            // Check for date overlap
            return cartItem.startDate <= item.endDate && cartItem.endDate >= item.startDate;
          })
          .reduce((sum, cartItem) => sum + cartItem.quantity, 0);

        // Check availability (passing 0 as cartQuantity since we're validating the cart itself)
        toolAvailabilityChecks.push(
          toolsAPI.checkAvailability(
            item.toolId,
            item.startDate,
            item.endDate,
            totalCartQuantity,
            0 // Don't double-count cart items since we're checking the cart itself
          ).then(response => ({
            toolId: item.toolId,
            toolName: item.toolName,
            startDate: item.startDate,
            endDate: item.endDate,
            requestedQuantity: totalCartQuantity,
            availability: response.data
          }))
        );
      }

      // Wait for all availability checks
      const availabilityResults = await Promise.all(toolAvailabilityChecks);

      // Check if any items are not available
      const unavailableItems = availabilityResults.filter(result => !result.availability.available);

      if (unavailableItems.length > 0) {
        const errorMessages = unavailableItems.map(item =>
          `${item.toolName} (${item.startDate} to ${item.endDate}): ${item.availability.reason}`
        ).join('\n');

        setError(`Cannot complete checkout. The following items are no longer available:\n\n${errorMessages}\n\nPlease remove unavailable items from your cart and try again.`);
        setProcessing(false);
        return;
      }

      // All items are available, proceed with creating reservations (batch - sends ONE email)
      const reservationsToCreate = cartItems.map(item => ({
        tool_id: item.toolId,
        start_date: item.startDate,
        end_date: item.endDate,
        quantity: item.quantity,
        total_price: item.totalPrice
      }));

      const batchResponse = await reservationsAPI.createBatch(reservationsToCreate);
      const createdReservations = batchResponse.data.reservations;

      // Create payment intents for all reservations
      const paymentPromises = createdReservations.map((reservation, index) => {
        return paymentsAPI.createPaymentIntent(reservation.id, cartItems[index].totalPrice);
      });

      const paymentResponses = await Promise.all(paymentPromises);

      // Confirm all payments
      const confirmPromises = paymentResponses.map((payment, index) => {
        return paymentsAPI.confirmPayment(payment.data.paymentIntentId, createdReservations[index].id);
      });

      await Promise.all(confirmPromises);

      // Clear cart after successful checkout
      clearCart();

      // Navigate to success page
      navigate('/checkout/success', {
        state: {
          orderCount: cartItems.length,
          totalAmount: getCartTotal(),
          reservations: createdReservations
        }
      });

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">
              Add items to your cart before checking out.
            </p>
            <button
              onClick={() => navigate('/tools')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
            >
              Browse Tools
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.toolName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <Calendar className="inline mr-1" size={14} />
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.days} {item.days === 1 ? 'day' : 'days'} × {item.quantity} {item.quantity === 1 ? 'tool' : 'tools'} × ${item.pricePerDay}/day
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">${item.totalPrice.toFixed(2)}</p>
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
                  Payment Information
                </h2>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {/* Phone Number Section */}
                  {needsPhoneNumber && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start mb-3">
                        <Phone className="text-yellow-600 mr-2 mt-1" size={20} />
                        <div>
                          <h3 className="text-sm font-semibold text-yellow-800">Phone Number Required</h3>
                          <p className="text-xs text-yellow-700 mt-1">
                            Please add your phone number before checkout. This helps us contact you about your rental.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                          placeholder="Enter phone number (10-15 digits)"
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
                              Saving...
                            </>
                          ) : (
                            'Save'
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
                            <span className="text-sm font-medium text-green-800">Contact Number: </span>
                            <span className="text-sm text-green-700">{phoneNumber}</span>
                          </div>
                        </div>
                        <CheckCircle className="text-green-600" size={20} />
                      </div>
                    </div>
                  )}

                  {/* Show credit card form only if total is greater than 0 */}
                  {getFinalTotal() > 0 ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={paymentInfo.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          value={paymentInfo.cardName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={paymentInfo.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            maxLength="5"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            value={paymentInfo.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            maxLength="4"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        * This is a demo. No real payment will be processed.
                      </p>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle className="mx-auto text-green-600 mb-3" size={48} />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">No Payment Required</h3>
                      <p className="text-sm text-green-700">
                        Your coupon covers the full amount. Click "Place Order" to complete your reservation.
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Order Total */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Total</h2>

                {/* Coupon Input */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have a Coupon?
                  </label>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold flex items-center"
                        >
                          {validatingCoupon ? (
                            <Loader className="animate-spin" size={16} />
                          ) : (
                            'Apply'
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
                              ? `${appliedCoupon.coupon.discount_value}% off`
                              : `$${appliedCoupon.coupon.discount_value} off`})
                          </span>
                        </div>
                        <button
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
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.coupon.code})</span>
                      <span>-${getDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${getFinalTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Place Order</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/cart')}
                  className="w-full mt-3 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 font-semibold"
                >
                  Back to Cart
                </button>

                <div className="mt-6 text-xs text-gray-500">
                  <p className="mb-2">By placing your order, you agree to our terms and conditions.</p>
                  <p>Your rental period starts on the date specified and all items must be returned by the end date.</p>
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

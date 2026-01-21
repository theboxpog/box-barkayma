import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Trash2, Calendar, Package, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { cartItems, removeFromCart, getCartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // Navigate to checkout page
    navigate('/checkout');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart size={56} className="mx-auto text-gray-400 mb-4 md:w-16 md:h-16" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">Your Cart is Empty</h1>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
              Browse our tools catalog and add items to your cart to get started.
            </p>
            <button
              onClick={() => navigate('/tools')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold w-full sm:w-auto"
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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white py-4 md:py-6 px-4 md:px-8">
              <div className="flex items-center space-x-3">
                <ShoppingCart size={28} className="md:w-8 md:h-8" />
                <div>
                  <h1 className="text-xl md:text-3xl font-bold">Shopping Cart</h1>
                  <p className="text-sm md:text-base text-blue-100">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.toolName}
                              className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 w-full">
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                              {item.toolName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              <Package className="inline mr-1" size={16} />
                              {item.toolCategory}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-sm">
                              <div className="flex items-center text-gray-700">
                                <Calendar className="mr-2" size={16} />
                                <span>
                                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                </span>
                              </div>
                              <div className="text-gray-700">
                                <span className="font-medium">Duration:</span> {item.days}{' '}
                                {item.days === 1 ? 'day' : 'days'}
                              </div>
                              <div className="text-gray-700">
                                <span className="font-medium">Quantity:</span> {item.quantity}{' '}
                                {item.quantity === 1 ? 'tool' : 'tools'}
                              </div>
                              <div className="text-gray-700">
                                <span className="font-medium">Price per day:</span> $
                                {item.pricePerDay}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start md:ml-6 md:text-right pt-3 md:pt-0 border-t md:border-t-0">
                        <div className="text-xl md:text-2xl font-bold text-blue-600 md:mb-4">
                          ${item.totalPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 flex items-center space-x-1 text-sm md:text-base"
                        >
                          <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 md:mt-8 pt-4 md:pt-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="text-xl md:text-2xl font-bold text-gray-800">Total</div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">
                    ${getCartTotal().toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => navigate('/tools')}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 md:px-6 rounded-md hover:bg-gray-300 font-semibold"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 md:px-6 rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center space-x-2"
                  >
                    <ArrowRight size={20} />
                    <span>Proceed to Checkout</span>
                  </button>
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-600 text-center mt-4">
                    Please{' '}
                    <button
                      onClick={() => navigate('/login')}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      login
                    </button>{' '}
                    to proceed with checkout
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Calendar, Home } from 'lucide-react';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state || {};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-6">
                <CheckCircle size={64} className="text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Order Placed Successfully!
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Thank you for your order. Your rental reservations have been confirmed.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Items</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {orderData.orderCount || 0} {orderData.orderCount === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(orderData.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">What's Next?</h2>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <CheckCircle size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Confirmation Email</h3>
                  <p className="text-gray-600 text-sm">
                    You will receive an email confirmation with your order details shortly.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Pickup Instructions</h3>
                  <p className="text-gray-600 text-sm">
                    Please bring your confirmation email and ID when picking up your tools on the rental start date.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Return Policy</h3>
                  <p className="text-gray-600 text-sm">
                    All tools must be returned by the end date specified in your reservation. Late returns may incur additional charges.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          {orderData.reservations && orderData.reservations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Details</h2>

              <div className="space-y-4">
                {orderData.reservations.map((reservation, index) => (
                  <div
                    key={reservation.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Rental Period:</span>{' '}
                          {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span>{' '}
                          <span className="text-green-600 font-semibold capitalize">
                            {reservation.status}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          ${reservation.total_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center space-x-2"
            >
              <Calendar size={20} />
              <span>View My Rentals</span>
            </button>

            <button
              onClick={() => navigate('/tools')}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 font-semibold flex items-center justify-center space-x-2"
            >
              <Package size={20} />
              <span>Browse More Tools</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 font-semibold flex items-center justify-center space-x-2"
            >
              <Home size={20} />
              <span>Go Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

import React, { useState, useEffect } from 'react';
import { reservationsAPI, paymentsAPI } from '../services/api';
import { Calendar, DollarSign, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-GB';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reservationsRes, paymentsRes] = await Promise.all([
        reservationsAPI.getMy(),
        paymentsAPI.getHistory()
      ]);
      setReservations(reservationsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-blue-100">Manage your rentals and view payment history</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'reservations'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={20} />
              <span>My Reservations</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'payments'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <DollarSign size={20} />
              <span>Payment History</span>
            </button>
          </div>
        </div>

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">No reservations yet</p>
                <a href="/tools" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                  Browse tools to get started
                </a>
              </div>
            ) : (
              reservations.map((reservation) => (
                <div key={reservation.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        {reservation.image_url ? (
                          <img
                            src={reservation.image_url}
                            alt={reservation.tool_name}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <Package className="text-gray-400" size={32} />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold">{reservation.tool_name}</h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </div>

                        <div className="text-gray-600 space-y-1">
                          <p className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            <span className="font-medium">From:</span>
                            <span className="ml-2">{new Date(reservation.start_date).toLocaleDateString(locale)}</span>
                          </p>
                          <p className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            <span className="font-medium">To:</span>
                            <span className="ml-2">{new Date(reservation.end_date).toLocaleDateString(locale)}</span>
                          </p>
                          <p className="flex items-center">
                            <Package size={16} className="mr-2" />
                            <span className="font-medium">Quantity:</span>
                            <span className="ml-2">{reservation.quantity || 1} tool(s)</span>
                          </p>
                          <p className="flex items-center">
                            <DollarSign size={16} className="mr-2" />
                            <span className="font-medium">Total:</span>
                            <span className="ml-2 text-xl font-bold text-blue-600">
                              ₪{reservation.total_price}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">No payment history</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tool
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rental Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.timestamp).toLocaleDateString(locale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.tool_name}
                          </div>
                          <div className="text-sm text-gray-500">{payment.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.start_date).toLocaleDateString(locale)} -{' '}
                          {new Date(payment.end_date).toLocaleDateString(locale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₪{payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {payment.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

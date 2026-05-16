import React, { useState, useEffect } from 'react';
import { reservationsAPI } from '../services/api';
import { Calendar, DollarSign, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const UserDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-GB';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const reservationsRes = await reservationsAPI.getMy();
      setReservations(reservationsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentInfo = (reservation) => {
    const paid = reservation.paid_amount;
    const original = reservation.total_price;
    if (paid === null || paid === undefined) return null;
    if (paid === 0) return (
      <span className="text-lg font-bold text-green-600">
        {language === 'he' ? 'חינם (קופון) ✅' : 'Free (Coupon) ✅'}
      </span>
    );
    if (paid < original) {
      const discount = original - paid;
      return (
        <div className="text-sm space-y-0.5">
          <p className="text-gray-400 line-through">₪{original.toFixed(2)}</p>
          <p className="text-green-600">{language === 'he' ? 'הנחה: ' : 'Discount: '}-₪{discount.toFixed(2)}</p>
          <p className="text-xl font-bold text-brand-600">₪{paid.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-brand-100 text-brand-800';
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
      <div className="bg-brand-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-brand-200">Manage your rentals and view payment history</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">No reservations yet</p>
                <a href="/tools" className="text-brand-600 hover:text-brand-800 mt-2 inline-block">
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
                          <div className="flex items-start">
                            <DollarSign size={16} className="mr-2 mt-1 flex-shrink-0" />
                            {renderPaymentInfo(reservation) || (
                              <span className="text-xl font-bold text-brand-600">₪{reservation.total_price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
};

export default UserDashboard;

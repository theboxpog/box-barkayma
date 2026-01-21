import React, { useState, useEffect } from 'react';
import { reservationsAPI } from '../services/api';
import { AlertCircle, Package, User, Calendar, Clock } from 'lucide-react';

const OverdueTools = () => {
  const [overdueReservations, setOverdueReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverdueReservations();
  }, []);

  const fetchOverdueReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getOverdue();
      setOverdueReservations(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch overdue reservations:', err);
      setError('Failed to load overdue reservations');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysOverdue = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = today - end;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkAsReturned = async (reservationId) => {
    if (!window.confirm('Mark this tool as returned?')) {
      return;
    }

    try {
      await reservationsAPI.markAsReturned(reservationId);
      alert('Tool marked as returned successfully');
      fetchOverdueReservations();
    } catch (error) {
      console.error('Failed to mark as returned:', error);
      alert('Failed to mark tool as returned');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading overdue tools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={32} className="text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-800">Overdue Tools</h1>
        </div>
        <p className="text-gray-600">
          Tools that were not returned on time and need immediate attention.
        </p>
      </div>

      {overdueReservations.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <Package size={48} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No overdue tools at the moment. All tools have been returned on time.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-orange-600" size={20} />
              <p className="text-orange-800 font-semibold">
                {overdueReservations.length} tool(s) currently overdue
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {overdueReservations.map((reservation) => {
              const daysOverdue = calculateDaysOverdue(reservation.end_date);

              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-orange-100 rounded-full p-2">
                          <Package className="text-orange-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {reservation.tool_name}
                          </h3>
                          <p className="text-gray-600">{reservation.category}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User size={16} className="text-gray-500" />
                          <span className="text-sm">
                            <span className="font-semibold">{reservation.user_name}</span>
                            <span className="text-gray-500 ml-1">({reservation.user_email})</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} className="text-gray-500" />
                          <span className="text-sm">
                            Due: {new Date(reservation.end_date).toLocaleDateString('en-GB')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-orange-600" />
                          <span className="text-sm font-bold text-orange-600">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-sm">
                            Quantity: <span className="font-semibold">{reservation.quantity || 1}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-center font-bold">
                        OVERDUE
                      </div>
                      <button
                        onClick={() => handleMarkAsReturned(reservation.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Mark as Returned
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Reservation #{reservation.id}</span>
                      <span>Total Price: ${reservation.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default OverdueTools;

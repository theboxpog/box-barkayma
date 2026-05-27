import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationsAPI, toolsAPI } from '../services/api';
import { Package, User, Calendar, ArrowLeft, DollarSign } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ToolReservations = () => {
  const { t } = useLanguage();
  const { toolId } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [toolId, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tool details
      const toolResponse = await toolsAPI.getById(toolId);
      setTool(toolResponse.data);

      // Fetch reservations for this tool
      const params = { tool_id: toolId };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const reservationsResponse = await reservationsAPI.getAll(params);
      setReservations(reservationsResponse.data);

      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load reservations');
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
        return 'bg-brand-100 text-brand-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'returned':
        return 'bg-teal-100 text-teal-800';
      case 'overdue':
        return 'bg-orange-100 text-orange-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCounts = () => {
    return {
      all: reservations.length,
      active: reservations.filter(r => r.status === 'active').length,
      delivered: reservations.filter(r => r.status === 'delivered').length,
      overdue: reservations.filter(r => r.status === 'overdue').length,
      returned: reservations.filter(r => r.status === 'returned').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
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

  const statusCounts = getStatusCounts();
  const filteredReservations = filterStatus === 'all'
    ? reservations
    : reservations.filter(r => r.status === filterStatus);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('backToAdminPanel')}</span>
        </button>

        {tool && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4">
              <div className="bg-brand-100 rounded-lg p-3">
                <Package size={32} className="text-brand-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {tool.name}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                  <div>
                    <span className="font-semibold">{t('categoryColon')}</span> {tool.category}
                  </div>
                  <div>
                    <span className="font-semibold">{t('priceColon')}</span> ₪{tool.rental_type === 'fixed_price' ? tool.fixed_price : `${tool.price_per_day}/${t('day')}`}
                  </div>
                  <div>
                    <span className="font-semibold">{t('stockColon')}</span> {tool.stock} {t('units')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('filterAll')} ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('statusActive')} ({statusCounts.active})
          </button>
          <button
            onClick={() => setFilterStatus('delivered')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'delivered'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('statusDelivered')} ({statusCounts.delivered})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'overdue'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('statusOverdue')} ({statusCounts.overdue})
          </button>
          <button
            onClick={() => setFilterStatus('returned')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'returned'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('statusReturned')} ({statusCounts.returned})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'completed'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('statusCompleted')} ({statusCounts.completed})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filterStatus === 'cancelled'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('statusCancelled')} ({statusCounts.cancelled})
          </button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {t('reservationHistory')} ({filteredReservations.length})
        </h2>

        {filteredReservations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p>{t('noReservationsFoundTool')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <User size={20} className="text-gray-500" />
                      <div>
                        <span className="font-semibold text-gray-800">
                          {reservation.user_name}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">
                          ({reservation.user_email})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={16} className="text-gray-500" />
                        <span>
                          {new Date(reservation.start_date).toLocaleDateString('en-GB')} - {new Date(reservation.end_date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Package size={16} className="text-gray-500" />
                        <span>{t('qtyShort')} {reservation.quantity || 1}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign size={16} className="text-gray-500" />
                        <span>₪{reservation.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                      {reservation.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('reservationNumLabel')} {reservation.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('createdLabel')} {new Date(reservation.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolReservations;

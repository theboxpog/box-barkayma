import React, { useState, useEffect } from 'react';
import { packagesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Package, Calendar, DollarSign, Tag, ChevronDown, ChevronUp } from 'lucide-react';

const Packages = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [reserving, setReserving] = useState(null);
  const [formState, setFormState] = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => {
    packagesAPI.getAll()
      .then(r => setPackages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getForm = (id, rentalType) => formState[id] || {
    start_date: '',
    end_date: '',
    quantity: 1,
    rental_type: rentalType
  };

  const setForm = (id, field, value) => {
    setFormState(prev => ({
      ...prev,
      [id]: { ...getForm(id), [field]: value }
    }));
  };

  const calcPrice = (pkg, form) => {
    if (pkg.rental_type === 'fixed_price') {
      return (pkg.fixed_price || 0) * (form.quantity || 1);
    }
    if (!form.start_date || !form.end_date) return null;
    const days = Math.ceil(
      (new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) return null;
    return (pkg.price_per_day || 0) * days * (form.quantity || 1);
  };

  const handleReserve = async (pkg) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const form = getForm(pkg.id, pkg.rental_type);
    setReserving(pkg.id);
    setMessages(prev => ({ ...prev, [pkg.id]: null }));
    try {
      await packagesAPI.reserve(pkg.id, {
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        quantity: form.quantity || 1
      });
      setMessages(prev => ({ ...prev, [pkg.id]: { type: 'success', text: t('packageReservedSuccess') } }));
    } catch (err) {
      setMessages(prev => ({
        ...prev,
        [pkg.id]: { type: 'error', text: err.response?.data?.error || 'Failed to reserve package' }
      }));
    } finally {
      setReserving(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto" />
        <p className="mt-4 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Tag size={32} className="text-brand-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('packages')}</h1>
          <p className="text-gray-600 mt-1">{t('browsePkgCatalog')}</p>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          <Tag size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-xl">{t('noPkgsAvailable')}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map(pkg => {
            const form = getForm(pkg.id, pkg.rental_type);
            const price = calcPrice(pkg, form);
            const msg = messages[pkg.id];

            return (
              <div key={pkg.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                {pkg.image_url && (
                  <img
                    src={pkg.image_url}
                    alt={pkg.name}
                    className="w-full h-48 object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-3">
                    <h2 className="text-xl font-bold text-gray-800">{pkg.name}</h2>
                  </div>

                  {pkg.description && (
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-brand-700 font-semibold mb-4">
                    <DollarSign size={16} />
                    {pkg.rental_type === 'fixed_price'
                      ? `₪${pkg.fixed_price} ${t('fixedPriceRental')}`
                      : `₪${pkg.price_per_day}/${t('day')}`}
                  </div>

                  {/* Tools list (collapsible) */}
                  <button
                    onClick={() => toggleExpand(pkg.id)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2 hover:text-brand-600"
                  >
                    <span className="flex items-center gap-1">
                      <Package size={14} />
                      {t('packageContains')} ({pkg.tools?.length || 0})
                    </span>
                    {expanded[pkg.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expanded[pkg.id] && pkg.tools && (
                    <ul className="mb-4 space-y-1 text-sm text-gray-600 bg-gray-50 rounded p-3">
                      {pkg.tools.map((tool, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{tool.tool_name}</span>
                          <span className="font-semibold">×{tool.pkg_quantity}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Reservation form */}
                  <div className="mt-auto space-y-3">
                    {pkg.rental_type === 'by_date' && (
                      <>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">{t('startDate')}</label>
                            <input
                              type="date"
                              value={form.start_date}
                              onChange={e => setForm(pkg.id, 'start_date', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">{t('endDate')}</label>
                            <input
                              type="date"
                              value={form.end_date}
                              onChange={e => setForm(pkg.id, 'end_date', e.target.value)}
                              min={form.start_date || new Date().toISOString().split('T')[0]}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('quantity')}</label>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 1) setForm(pkg.id, 'quantity', v);
                        }}
                        min="1"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {price !== null && (
                      <div className="text-brand-700 font-bold text-lg">
                        {t('totalPrice')}: ₪{price.toFixed(2)}
                      </div>
                    )}

                    {msg && (
                      <div className={`text-sm rounded px-3 py-2 ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {msg.text}
                      </div>
                    )}

                    <button
                      onClick={() => handleReserve(pkg)}
                      disabled={reserving === pkg.id}
                      className="w-full bg-brand-600 text-white py-2 px-4 rounded hover:bg-brand-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {reserving === pkg.id ? t('reservingPackage') : t('reservePackage')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Packages;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packagesAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Tag, Package, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import DatePicker from '../components/DatePicker';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addPackageToCart } = useCart();
  const { t } = useLanguage();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowedDays, setAllowedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      packagesAPI.getById(id),
      settingsAPI.getRentalDays()
    ])
      .then(([pkgRes, daysRes]) => {
        setPkg(pkgRes.data);
        setAllowedDays(daysRes.data.allowedDays);
      })
      .catch(() => setError('notFound'))
      .finally(() => setLoading(false));
  }, [id]);

  const isDateAllowed = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return allowedDays.includes(date.getDay());
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  const checkAvailability = async () => {
    if (pkg.rental_type !== 'fixed_price') {
      if (!startDate || !endDate) { setError(t('selectBothDates') || 'Please select both dates'); return; }
      if (new Date(endDate) <= new Date(startDate)) { setError(t('endDateAfterStart') || 'End date must be after start date'); return; }
      if (!isDateAllowed(startDate)) {
        setError(`Start date must be on: ${allowedDays.map(getDayName).join(', ')}`); return;
      }
      if (!isDateAllowed(endDate)) {
        setError(`End date must be on: ${allowedDays.map(getDayName).join(', ')}`); return;
      }
    }
    setChecking(true); setError(''); setAvailability(null);
    try {
      const res = await packagesAPI.checkAvailability(
        id,
        pkg.rental_type !== 'fixed_price' ? startDate : null,
        pkg.rental_type !== 'fixed_price' ? endDate : null,
        quantity
      );
      setAvailability(res.data);
    } catch {
      setError('Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    addPackageToCart(pkg, startDate || null, endDate || null, quantity);
    navigate('/cart');
  };

  const calcPrice = () => {
    if (!pkg) return 0;
    if (pkg.rental_type === 'fixed_price') return (pkg.fixed_price || 0) * quantity;
    if (!startDate || !endDate) return 0;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return days > 0 ? (pkg.price_per_day || 0) * days * quantity : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{t('noToolsFound')}</div>
      </div>
    );
  }

  const price = calcPrice();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">

            {/* Image */}
            <div>
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                {pkg.image_url ? (
                  <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Tag className="h-32 w-32 text-purple-300" />
                )}
              </div>
            </div>

            {/* Details + Booking */}
            <div>
              <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded mb-3">
                {t('packages')}
              </span>
              <h1 className="text-3xl font-bold mb-3">{pkg.name}</h1>

              <div className="text-2xl font-bold text-brand-600 mb-4">
                {pkg.rental_type === 'fixed_price'
                  ? <>{t('fixedPriceRental')}: ₪{pkg.fixed_price}</>
                  : <>₪{pkg.price_per_day}<span className="text-lg font-normal text-gray-600">/{t('day')}</span></>
                }
              </div>

              {pkg.description && <p className="text-gray-600 mb-5">{pkg.description}</p>}

              {/* Tools list collapsible */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 hover:text-brand-600"
              >
                <Package size={16} />
                {t('packageContains')} ({pkg.tools?.length || 0})
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expanded && pkg.tools && (
                <ul className="mb-5 space-y-1 text-sm text-gray-600 bg-gray-50 rounded p-3">
                  {pkg.tools.map((tool, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{tool.tool_name}</span>
                      <span className="font-semibold">×{tool.pkg_quantity}</span>
                    </li>
                  ))}
                </ul>
              )}

              {!pkg.is_available ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                  <AlertCircle size={20} />
                  {t('toolUnavailable')}
                </div>
              ) : (
                <div className="border-t pt-6 space-y-4">

                  {pkg.rental_type === 'by_date' && (
                    <>
                      <DatePicker
                        label={t('startDate')}
                        value={startDate}
                        onChange={(date) => { setStartDate(date); setAvailability(null); setError(''); }}
                        minDate={new Date().toISOString().split('T')[0]}
                        allowedDays={allowedDays}
                      />
                      <DatePicker
                        label={t('endDate')}
                        value={endDate}
                        onChange={(date) => { setEndDate(date); setAvailability(null); setError(''); }}
                        minDate={startDate || new Date().toISOString().split('T')[0]}
                        allowedDays={allowedDays}
                      />
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('quantity')}</label>
                    <input
                      type="number"
                      value={quantity}
                      min="1"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') { setQuantity(''); return; }
                        const v = parseInt(raw);
                        if (!isNaN(v) && v >= 1) { setQuantity(v); setAvailability(null); }
                      }}
                      onBlur={() => { if (!quantity || parseInt(quantity) < 1) setQuantity(1); }}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {price > 0 && (
                    <div className="bg-brand-50 p-4 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{t('totalPrice')}:</span>
                        <span className="text-2xl font-bold text-brand-600">₪{price.toFixed(2)}</span>
                      </div>
                      {pkg.rental_type === 'by_date' && startDate && endDate && (
                        <p className="text-sm text-gray-600 mt-1">
                          {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} {t('days')} × {quantity} × ₪{pkg.price_per_day}/{t('day')}
                        </p>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
                      <CheckCircle size={20} />
                      {success}
                    </div>
                  )}

                  <button
                    onClick={checkAvailability}
                    disabled={checking || (pkg.rental_type === 'by_date' && (!startDate || !endDate))}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    {checking ? t('checking') : t('checkAvailabilityBtn')}
                  </button>

                  {availability && (
                    <div className={`p-4 rounded ${availability.available ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                      {availability.available
                        ? '✓ ' + (t('availableForDates') || 'Available!')
                        : '✗ ' + availability.reason}
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={!availability?.available}
                    className="w-full bg-brand-600 text-white py-3 px-4 rounded-md hover:bg-brand-700 disabled:opacity-50 font-semibold"
                  >
                    {t('addToCart')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;

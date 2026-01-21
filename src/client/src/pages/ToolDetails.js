import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toolsAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Package, Calendar, DollarSign, AlertCircle, ShoppingCart, CheckCircle } from 'lucide-react';
import DatePicker from '../components/DatePicker';

const ToolDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, cartItems } = useCart();

  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [allowedDays, setAllowedDays] = useState([0, 1, 2, 3, 4, 5, 6]); // Default: all days

  useEffect(() => {
    fetchTool();
    fetchAllowedDays();
  }, [id]);

  const fetchAllowedDays = async () => {
    try {
      const response = await settingsAPI.getRentalDays();
      setAllowedDays(response.data.allowedDays);
    } catch (error) {
      console.error('Failed to fetch allowed rental days:', error);
      // Keep default: all days allowed
    }
  };

  const fetchTool = async () => {
    try {
      const response = await toolsAPI.getById(id);
      setTool(response.data);
    } catch (error) {
      console.error('Failed to fetch tool:', error);
      setError('Tool not found');
    } finally {
      setLoading(false);
    }
  };

  const isDateAllowed = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return allowedDays.includes(dayOfWeek);
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  const getAllowedDaysText = () => {
    return allowedDays.map(d => getDayName(d)).join(', ');
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError('End date must be after start date');
      return;
    }

    // Validate dates against allowed days
    if (!isDateAllowed(startDate)) {
      setError(`Start date must be on: ${getAllowedDaysText()}`);
      return;
    }

    if (!isDateAllowed(endDate)) {
      setError(`End date must be on: ${getAllowedDaysText()}`);
      return;
    }

    setChecking(true);
    setError('');

    try {
      // Calculate quantity already in cart for this tool with overlapping dates
      const cartQuantity = cartItems
        .filter(item => {
          if (item.toolId !== parseInt(id)) return false;

          // Check if cart item dates overlap with requested dates
          const itemStart = item.startDate;
          const itemEnd = item.endDate;

          // Dates overlap if: item starts before/on requested end AND item ends after/on requested start
          return itemStart <= endDate && itemEnd >= startDate;
        })
        .reduce((sum, item) => sum + item.quantity, 0);

      const response = await toolsAPI.checkAvailability(id, startDate, endDate, quantity, cartQuantity);
      setAvailability(response.data);
    } catch (error) {
      setError('Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  const calculatePrice = () => {
    if (!startDate || !endDate || !tool) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days * tool.price_per_day * quantity;
  };

  const handleAddToCart = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (!availability?.available) {
      setError('Please check availability first');
      return;
    }

    setError('');

    // Add to cart
    addToCart(tool, startDate, endDate, quantity);

    // Show success message
    setShowAddedMessage(true);

    // Hide message after 5 seconds (gives time to click View Cart)
    setTimeout(() => {
      setShowAddedMessage(false);
    }, 5000);

    // Reset form
    setStartDate('');
    setEndDate('');
    setQuantity(1);
    setAvailability(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error && !tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const totalPrice = calculatePrice();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Tool Image */}
            <div>
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                {tool.image_url ? (
                  <img
                    src={tool.image_url}
                    alt={tool.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="h-32 w-32 text-gray-400" />
                )}
              </div>
            </div>

            {/* Tool Info */}
            <div>
              <span className="inline-block text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded mb-3">
                {tool.category}
              </span>
              <h1 className="text-3xl font-bold mb-4">{tool.name}</h1>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">
                  ${tool.price_per_day}
                  <span className="text-lg text-gray-600 font-normal">/day</span>
                </span>
              </div>

              {tool.stock !== undefined && (
                <div className="mb-6 text-gray-600">
                  <Package className="inline mr-2" size={18} />
                  <span className="font-medium">Total Stock:</span> {tool.stock} available
                </div>
              )}

              {!tool.is_available && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <AlertCircle className="inline mr-2" size={20} />
                  This tool is currently unavailable (maintenance mode)
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">
                  {tool.description || 'No description available'}
                </p>
              </div>

              {/* Booking Form */}
              {tool.is_available && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Calendar className="mr-2" size={20} />
                    Book This Tool
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        setAvailability(null);
                        setError('');
                      }}
                      minDate={new Date().toISOString().split('T')[0]}
                      allowedDays={allowedDays}
                    />

                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(date) => {
                        setEndDate(date);
                        setAvailability(null);
                        setError('');
                      }}
                      minDate={startDate || new Date().toISOString().split('T')[0]}
                      allowedDays={allowedDays}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1) {
                            setQuantity(value);
                          }
                        }}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How many of this tool do you want to rent?
                      </p>
                    </div>

                    {startDate && endDate && (
                      <div className="bg-blue-50 p-4 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Price:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ${totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days × {quantity} tool(s) × ${tool.price_per_day}/day
                        </p>
                      </div>
                    )}

                    <button
                      onClick={checkAvailability}
                      disabled={checking || !startDate || !endDate}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      {checking ? 'Checking...' : 'Check Availability'}
                    </button>

                    {availability && (
                      <div className={`p-4 rounded ${availability.available ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                        <div className="font-semibold mb-2">
                          {availability.available ? '✓ Available for these dates!' : '✗ ' + availability.reason}
                        </div>
                        {availability.availableStock !== undefined && (
                          <div className="text-sm mt-2">
                            <div>Available stock: {availability.availableStock} / {availability.totalStock}</div>
                            {availability.reservedStock > 0 && (
                              <div>Already reserved: {availability.reservedStock}</div>
                            )}
                            {availability.cartQuantity > 0 && (
                              <div>Already in cart: {availability.cartQuantity}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {showAddedMessage && (
                      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce-in">
                        <div className="flex items-center justify-center space-x-3 mb-3">
                          <div className="bg-white rounded-full p-2">
                            <CheckCircle size={24} className="text-green-500" />
                          </div>
                          <span className="text-lg font-bold">Added to Cart!</span>
                        </div>
                        <div className="text-center">
                          <p className="text-sm mb-3">
                            {tool.name} has been added to your cart
                          </p>
                          <button
                            onClick={() => navigate('/cart')}
                            className="bg-white text-green-600 px-6 py-2 rounded-md font-semibold hover:bg-green-50 transition-colors"
                          >
                            View Cart
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAddToCart}
                      disabled={!availability?.available}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart size={20} />
                      <span>Add to Cart</span>
                    </button>

                    <p className="text-sm text-gray-600 text-center">
                      Items will be held in your cart until checkout
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetails;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toolsAPI, settingsAPI } from '../services/api';
import { Search, Calendar, Package, DollarSign } from 'lucide-react';
import DatePicker from '../components/DatePicker';

const ToolAvailability = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allTools, setAllTools] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allowedDays, setAllowedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllTools();
    fetchAllowedDays();
  }, []);

  const fetchAllTools = async () => {
    try {
      const response = await toolsAPI.getAll();
      setAllTools(response.data);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    }
  };

  const fetchAllowedDays = async () => {
    try {
      const response = await settingsAPI.getRentalDays();
      setAllowedDays(response.data.allowedDays);
    } catch (error) {
      console.error('Failed to fetch allowed rental days:', error);
    }
  };

  const isDateAllowed = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();
    return allowedDays.includes(dayOfWeek);
  };

  const handleSearch = async () => {
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
      setError('Start date is not an allowed rental day');
      return;
    }

    if (!isDateAllowed(endDate)) {
      setError('End date is not an allowed rental day');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      // Check availability for each tool
      const availabilityPromises = allTools.map(async (tool) => {
        try {
          const response = await toolsAPI.checkAvailability(tool.id, startDate, endDate, 1);
          return {
            ...tool,
            availabilityData: response.data
          };
        } catch (error) {
          return {
            ...tool,
            availabilityData: { available: false, reason: 'Error checking availability' }
          };
        }
      });

      const results = await Promise.all(availabilityPromises);
      const available = results.filter(tool =>
        tool.is_available && tool.availabilityData?.available
      );
      setAvailableTools(available);
    } catch (error) {
      console.error('Failed to check availability:', error);
      setError('Failed to check tool availability');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const days = calculateDays();

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Check Tool Availability</h1>
          <p className="text-sm md:text-base text-gray-600">
            Find which tools are available for your desired rental dates
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-blue-600 md:w-6 md:h-6" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Select Rental Period</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setSearched(false);
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
                setSearched(false);
                setError('');
              }}
              minDate={startDate || new Date().toISOString().split('T')[0]}
              allowedDays={allowedDays}
            />
          </div>

          {startDate && endDate && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Rental Period:</strong> {days} day{days !== 1 ? 's' : ''} ({startDate} to {endDate})
              </p>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || !startDate || !endDate}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            <Search size={20} />
            {loading ? 'Searching...' : 'Search Available Tools'}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking tool availability...</p>
          </div>
        )}

        {!loading && searched && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Available Tools ({availableTools.length})
              </h2>
              <p className="text-gray-600">
                {availableTools.length === 0
                  ? 'No tools available for these dates'
                  : `${availableTools.length} tool${availableTools.length !== 1 ? 's' : ''} available for your selected dates`}
              </p>
            </div>

            {availableTools.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <Calendar size={48} className="text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tools Available</h3>
                <p className="text-gray-600">
                  All tools are fully booked for the selected dates. Try different dates or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      {tool.image_url ? (
                        <img
                          src={tool.image_url}
                          alt={tool.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-gray-400" />
                      )}
                    </div>

                    <div className="p-4">
                      <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded mb-2">
                        {tool.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{tool.name}</h3>

                      <div className="flex items-center text-gray-700 mb-2">
                        <DollarSign size={18} className="text-blue-600" />
                        <span className="text-xl font-bold text-blue-600">
                          ${tool.price_per_day}
                          <span className="text-sm text-gray-600 font-normal">/day</span>
                        </span>
                      </div>

                      {tool.availabilityData && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <p className="text-green-700 font-semibold">
                            ✓ Available: {tool.availabilityData.availableStock} / {tool.availabilityData.totalStock} in stock
                          </p>
                          <p className="text-gray-600 mt-1">
                            Total: ${(tool.price_per_day * days).toFixed(2)} for {days} day{days !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      <Link
                        to={`/tools/${tool.id}`}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors font-semibold"
                      >
                        View Details & Book
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolAvailability;

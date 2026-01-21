import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toolsAPI } from '../services/api';
import { Package, Search, Calendar } from 'lucide-react';

const ToolsCatalog = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTools();
  }, [category]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await toolsAPI.getAll(category);
      setTools(response.data);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(tools.map(tool => tool.category))];

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading tools...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Tool Catalog</h1>
          <p className="text-blue-100">Browse and rent professional tools</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability Search Button */}
        <Link
          to="/availability"
          className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6 rounded-lg shadow-lg mb-8 hover:from-blue-700 hover:to-blue-800 transition-all active:scale-98"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 md:space-x-3 flex-1">
              <Calendar size={28} className="text-white flex-shrink-0 md:w-8 md:h-8" />
              <div className="min-w-0">
                <h2 className="text-base md:text-xl font-bold leading-tight">Check Tool Availability</h2>
                <p className="text-blue-100 text-xs md:text-sm mt-1">Search for all tools available on specific dates</p>
              </div>
            </div>
            <span className="text-white font-semibold text-sm md:text-base flex-shrink-0">Search →</span>
          </div>
        </Link>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">No tools found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map(tool => (
              <Link
                key={tool.id}
                to={`/tools/${tool.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {tool.image_url ? (
                    <img
                      src={tool.image_url}
                      alt={tool.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-20 w-20 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {tool.category}
                    </span>
                    {!tool.is_available && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                        Maintenance
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {tool.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      ${tool.price_per_day}
                      <span className="text-sm text-gray-600 font-normal">/day</span>
                    </span>
                    <span className="text-blue-600 font-medium hover:text-blue-800">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsCatalog;

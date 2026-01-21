import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toolsAPI, reservationsAPI, couponsAPI } from '../services/api';
import { Package, Calendar, Plus, Edit, Trash2, X, List, Tag, Settings } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tools');
  const [tools, setTools] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [archivedReservations, setArchivedReservations] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToolForm, setShowToolForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortByDate, setSortByDate] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchDate, setSearchDate] = useState('');
  const [userListSearchDate, setUserListSearchDate] = useState('');
  const [toolForm, setToolForm] = useState({
    name: '',
    category: '',
    price_per_day: '',
    description: '',
    image_url: '',
    stock: 5,
    is_available: true
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: 0,
    max_uses: '',
    expiry_date: '',
    is_active: true,
    allowed_categories: '',
    allowed_tools: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [toolsRes, reservationsRes, archivedRes, couponsRes] = await Promise.all([
        toolsAPI.getAll(),
        reservationsAPI.getAll(),
        reservationsAPI.getArchived(),
        couponsAPI.getAll()
      ]);
      setTools(toolsRes.data);
      setReservations(reservationsRes.data);
      setArchivedReservations(archivedRes.data);
      setCoupons(couponsRes.data);
      return { reservations: reservationsRes.data, tools: toolsRes.data, archived: archivedRes.data, coupons: couponsRes.data };
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleToolFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setToolForm({
      ...toolForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmitTool = async (e) => {
    e.preventDefault();
    try {
      if (editingTool) {
        await toolsAPI.update(editingTool.id, toolForm);
        alert('Tool updated successfully');
      } else {
        await toolsAPI.create(toolForm);
        alert('Tool created successfully');
      }
      setShowToolForm(false);
      setEditingTool(null);
      setToolForm({
        name: '',
        category: '',
        price_per_day: '',
        description: '',
        image_url: '',
        stock: 5,
        is_available: true
      });
      fetchData();
    } catch (error) {
      alert('Failed to save tool');
    }
  };

  const handleEditTool = (tool) => {
    setEditingTool(tool);
    setToolForm({
      name: tool.name,
      category: tool.category,
      price_per_day: tool.price_per_day,
      description: tool.description || '',
      image_url: tool.image_url || '',
      stock: tool.stock || 5,
      is_available: tool.is_available
    });
    setShowToolForm(true);
  };

  const handleDeleteTool = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) {
      return;
    }
    try {
      await toolsAPI.delete(id);
      alert('Tool deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete tool');
    }
  };

  // Coupon handlers
  const handleCouponFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCouponForm({
      ...couponForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmitCoupon = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await couponsAPI.update(editingCoupon.id, couponForm);
        alert('Coupon updated successfully');
      } else {
        await couponsAPI.create(couponForm);
        alert('Coupon created successfully');
      }
      setShowCouponForm(false);
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: 0,
        max_uses: '',
        expiry_date: '',
        is_active: true,
        allowed_categories: '',
        allowed_tools: ''
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save coupon');
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value || 0,
      max_uses: coupon.max_uses || '',
      expiry_date: coupon.expiry_date || '',
      is_active: Boolean(coupon.is_active),
      allowed_categories: coupon.allowed_categories || '',
      allowed_tools: coupon.allowed_tools || ''
    });
    setShowCouponForm(true);
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }
    try {
      await couponsAPI.delete(id);
      alert('Coupon deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete coupon');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    try {
      await reservationsAPI.adminCancel(reservationId);
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert('Reservation cancelled successfully');
    } catch (error) {
      alert('Failed to cancel reservation');
    }
  };

  const handleMarkAsDelivered = async (reservationId) => {
    if (!window.confirm('Mark this reservation as delivered?')) {
      return;
    }
    try {
      await reservationsAPI.markAsDelivered(reservationId);
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert('Reservation marked as delivered successfully');
    } catch (error) {
      alert('Failed to mark reservation as delivered');
    }
  };

  const handleMarkAsReturned = async (reservationId) => {
    if (!window.confirm('Mark this reservation as returned?')) {
      return;
    }
    try {
      await reservationsAPI.markAsReturned(reservationId);
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert('Reservation marked as returned successfully');
    } catch (error) {
      alert('Failed to mark reservation as returned');
    }
  };

  const handleArchiveReservation = async (reservationId) => {
    if (!window.confirm('Move this reservation to Past Reservations?')) {
      return;
    }
    try {
      await reservationsAPI.archive(reservationId);
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert('Reservation moved to Past Reservations');
    } catch (error) {
      alert('Failed to archive reservation');
    }
  };

  const handleRestoreReservation = async (reservationId) => {
    if (!window.confirm('Restore this reservation back to active view?')) {
      return;
    }
    try {
      const response = await reservationsAPI.restore(reservationId);
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert(`Reservation restored successfully as ${response.data.status}`);
    } catch (error) {
      alert('Failed to restore reservation');
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (!window.confirm('⚠️ WARNING: This will PERMANENTLY delete the reservation and cannot be undone!\n\nAre you sure you want to delete this reservation?')) {
      return;
    }
    try {
      await reservationsAPI.adminDelete(reservationId);
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert('Reservation permanently deleted');
    } catch (error) {
      alert('Failed to delete reservation');
    }
  };

  const handleMarkOverdue = async () => {
    try {
      const response = await reservationsAPI.markOverdue();
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations);
      alert(`${response.data.count} reservation(s) marked as overdue`);
    } catch (error) {
      alert('Failed to mark overdue reservations');
    }
  };

  const handleFilterChange = async (status) => {
    setFilterStatus(status);
    setLoading(true);
    try {
      let response;
      if (status === 'active') {
        response = await reservationsAPI.getActive();
      } else if (status === 'overdue') {
        response = await reservationsAPI.getOverdue();
      } else {
        response = await reservationsAPI.getAll();
      }
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to fetch filtered reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group reservations by user
  const getUserGroups = (reservationsData = null) => {
    const data = reservationsData || reservations;
    const groups = {};
    data.forEach(res => {
      // Filter by user list search date if specified
      if (userListSearchDate && res.start_date !== userListSearchDate) {
        return; // Skip this reservation
      }

      const userKey = `${res.user_id}`;
      if (!groups[userKey]) {
        groups[userKey] = {
          userId: res.user_id,
          userName: res.user_name,
          userEmail: res.user_email,
          reservations: []
        };
      }
      groups[userKey].reservations.push(res);
    });
    return Object.values(groups);
  };

  const updateSelectedUser = (freshReservations) => {
    if (selectedUser && freshReservations) {
      const updatedGroups = getUserGroups(freshReservations);
      const updatedUser = updatedGroups.find(g => g.userId === selectedUser.userId);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      } else {
        setSelectedUser(null);
      }
    }
  };

  // Sort and filter reservations by start date and status
  const getSortedReservations = (userReservations) => {
    // First, filter by status if not 'all'
    let filtered = userReservations;
    if (filterStatus !== 'all') {
      filtered = userReservations.filter(r => r.status === filterStatus);
    }

    // Filter by search date if specified
    if (searchDate) {
      filtered = filtered.filter(r => r.start_date === searchDate);
    }

    // Then sort by date if enabled
    if (!sortByDate) return filtered;
    return [...filtered].sort((a, b) => {
      return new Date(a.start_date) - new Date(b.start_date);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
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

  // Get unique categories from tools
  const getUniqueCategories = () => {
    const categories = [...new Set(tools.map(tool => tool.category))];
    return categories.sort();
  };

  // Calculate available quantity for a tool
  const getAvailableQuantity = (toolId, totalStock) => {
    const today = new Date().toISOString().split('T')[0];

    // Get all active, delivered, and overdue reservations for this tool
    // Note: 'returned' status means tool is back and available, so it's not included
    const toolReservations = reservations.filter(
      r => r.tool_id === toolId && (r.status === 'active' || r.status === 'delivered' || r.status === 'overdue')
    );

    // Calculate currently reserved quantity
    const reservedQuantity = toolReservations.reduce((sum, r) => {
      if (r.status === 'active') {
        // Active reservations: check if they overlap with today
        if (r.start_date <= today && r.end_date >= today) {
          return sum + (r.quantity || 1);
        }
      } else if (r.status === 'delivered') {
        // Delivered reservations: tool is with customer, reduce available quantity
        return sum + (r.quantity || 1);
      } else if (r.status === 'overdue') {
        // Overdue reservations: tool is still with customer, reduce available quantity
        if (r.start_date <= today) {
          return sum + (r.quantity || 1);
        }
      }
      return sum;
    }, 0);

    return totalStock - reservedQuantity;
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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Manage tools and reservations</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'tools'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package size={20} />
              <span>Manage Tools</span>
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'reservations'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={20} />
              <span>View Reservations</span>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'archived'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Trash2 size={20} />
              <span>Past Reservations</span>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'coupons'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Tag size={20} />
              <span>Coupons</span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center space-x-2 px-6 py-4 font-semibold text-gray-600 hover:text-gray-800"
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowToolForm(true);
                  setEditingTool(null);
                  setToolForm({
                    name: '',
                    category: '',
                    price_per_day: '',
                    description: '',
                    image_url: '',
                    stock: 5,
                    is_available: true
                  });
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Add New Tool</span>
              </button>
            </div>

            {/* Tool Form Modal */}
            {showToolForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {editingTool ? 'Edit Tool' : 'Add New Tool'}
                    </h2>
                    <button onClick={() => setShowToolForm(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitTool} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tool Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={toolForm.name}
                        onChange={handleToolFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={toolForm.category}
                        onChange={handleToolFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Power Tools, Hand Tools, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per Day *
                      </label>
                      <input
                        type="number"
                        name="price_per_day"
                        value={toolForm.price_per_day}
                        onChange={handleToolFormChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={toolForm.stock}
                        onChange={handleToolFormChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total number of this tool available for rent
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={toolForm.description}
                        onChange={handleToolFormChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="image_url"
                        value={toolForm.image_url}
                        onChange={handleToolFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_available"
                        checked={toolForm.is_available}
                        onChange={handleToolFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Tool is available (uncheck for maintenance)
                      </label>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                      >
                        {editingTool ? 'Update Tool' : 'Create Tool'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowToolForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Tools List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tool
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price/Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tools.map((tool) => (
                    <tr key={tool.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tool.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${tool.price_per_day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tool.stock || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tool.is_available ? (
                          <div className="flex flex-col">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                              Available
                            </span>
                            <span className="text-sm text-gray-600 mt-1">
                              {getAvailableQuantity(tool.id, tool.stock)} / {tool.stock} in stock
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Maintenance
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/admin/tools/${tool.id}/reservations`)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                        >
                          <List size={16} className="mr-1" />
                          Reservations
                        </button>
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div>
            {!selectedUser ? (
              /* User List View */
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Reservations by User</h2>
                  <p className="text-sm text-gray-600">Click on a user to view their reservations</p>
                  <div className="flex items-center space-x-2 mt-3 text-sm">
                    <label htmlFor="userListSearchDate" className="font-medium">
                      Filter by Start Date:
                    </label>
                    <input
                      id="userListSearchDate"
                      type="date"
                      value={userListSearchDate}
                      onChange={(e) => setUserListSearchDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {userListSearchDate && (
                      <button
                        onClick={() => setUserListSearchDate('')}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {getUserGroups().map((userGroup) => (
                    <button
                      key={userGroup.userId}
                      onClick={() => setSelectedUser(userGroup)}
                      className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {userGroup.userName}
                          </div>
                          <div className="text-sm text-gray-600">{userGroup.userEmail}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {userGroup.reservations.length}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userGroup.reservations.length === 1 ? 'Reservation' : 'Reservations'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {getUserGroups().length === 0 && (
                    <div className="px-6 py-12 text-center text-gray-500">
                      No reservations found
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* User Reservations Detail View */
              <div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="mr-2">←</span> Back to Users List
                </button>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                    <h2 className="text-xl font-bold text-gray-800">{selectedUser.userName}</h2>
                    <p className="text-sm text-gray-600">{selectedUser.userEmail}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Total Reservations: {selectedUser.reservations.length}
                    </p>
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          filterStatus === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All ({selectedUser.reservations.length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          filterStatus === 'active'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Active ({selectedUser.reservations.filter(r => r.status === 'active').length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('overdue')}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          filterStatus === 'overdue'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Overdue ({selectedUser.reservations.filter(r => r.status === 'overdue').length})
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sortByDate}
                          onChange={(e) => setSortByDate(e.target.checked)}
                          className="rounded"
                        />
                        <span>Sort by Start Date</span>
                      </label>
                      <div className="flex items-center space-x-2 text-sm">
                        <label htmlFor="searchDate" className="font-medium">
                          Filter by Start Date:
                        </label>
                        <input
                          id="searchDate"
                          type="date"
                          value={searchDate}
                          onChange={(e) => setSearchDate(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchDate && (
                          <button
                            onClick={() => setSearchDate('')}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tool
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Available
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedReservations(selectedUser.reservations).map((reservation) => {
                        const tool = tools.find(t => t.id === reservation.tool_id);
                        const toolStock = tool?.stock || 0;
                        const availableQty = getAvailableQuantity(reservation.tool_id, toolStock);
                        const today = new Date().toISOString().split('T')[0];

                        // Check if reservation includes today and has zero availability
                        // For overdue: item is still with customer (past end_date), so check if start_date <= today
                        // For active/delivered: check normal date range
                        const isActiveToday = reservation.status === 'overdue'
                          ? reservation.start_date <= today  // Overdue items are still out
                          : reservation.start_date <= today && reservation.end_date >= today;
                        const hasZeroAvailability = availableQty === 0;
                        const isActiveStatus = ['active', 'delivered', 'overdue'].includes(reservation.status);
                        const showWarning = isActiveToday && hasZeroAvailability && isActiveStatus;

                        return (
                        <tr key={reservation.id} className={showWarning ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.tool_name}
                            </div>
                            <div className="text-sm text-gray-500">{reservation.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {reservation.quantity || 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={`text-sm ${showWarning ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                {availableQty} / {toolStock} in stock
                              </span>
                              {showWarning && (
                                <span className="text-xs text-red-600 font-semibold mt-1">
                                  ⚠ NO STOCK AVAILABLE TODAY!
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(reservation.start_date).toLocaleDateString('en-GB')} -{' '}
                            {new Date(reservation.end_date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${reservation.total_price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                              {reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-1">
                              {reservation.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => handleMarkAsDelivered(reservation.id)}
                                    className="text-green-600 hover:text-green-900 text-left"
                                  >
                                    Mark Delivered
                                  </button>
                                  <button
                                    onClick={() => handleArchiveReservation(reservation.id)}
                                    className="text-gray-600 hover:text-gray-900 text-left"
                                  >
                                    Move to Past
                                  </button>
                                </>
                              )}
                              {reservation.status === 'delivered' && (
                                <>
                                  <button
                                    onClick={() => handleMarkAsReturned(reservation.id)}
                                    className="text-blue-600 hover:text-blue-900 text-left"
                                  >
                                    Mark Returned
                                  </button>
                                  <button
                                    onClick={() => handleArchiveReservation(reservation.id)}
                                    className="text-gray-600 hover:text-gray-900 text-left"
                                  >
                                    Move to Past
                                  </button>
                                </>
                              )}
                              {reservation.status === 'overdue' && (
                                <button
                                  onClick={() => handleArchiveReservation(reservation.id)}
                                  className="text-gray-600 hover:text-gray-900 text-left"
                                >
                                  Move to Past
                                </button>
                              )}
                              {reservation.status === 'returned' && (
                                <button
                                  onClick={() => handleArchiveReservation(reservation.id)}
                                  className="text-gray-600 hover:text-gray-900 text-left"
                                >
                                  Move to Past
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past Reservations Tab */}
        {activeTab === 'archived' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Past Reservations</h2>
              <p className="text-sm text-gray-600">Archived reservations that have been removed from active view</p>
              <p className="text-sm text-blue-600 mt-2">Total: {archivedReservations.length} archived reservation(s)</p>
            </div>

            {archivedReservations.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Trash2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl">No archived reservations</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tool
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {archivedReservations.map((reservation) => (
                      <tr key={reservation.id} className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.user_name}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.user_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.tool_name}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {reservation.quantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reservation.start_date).toLocaleDateString('en-GB')} -{' '}
                          {new Date(reservation.end_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${reservation.total_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleRestoreReservation(reservation.id)}
                              className="text-blue-600 hover:text-blue-900 text-left"
                            >
                              Restore to Active
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(reservation.id)}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowCouponForm(true);
                  setEditingCoupon(null);
                  setCouponForm({
                    code: '',
                    discount_type: 'percentage',
                    discount_value: '',
                    min_order_value: 0,
                    max_uses: '',
                    expiry_date: '',
                    is_active: true,
                    allowed_categories: '',
                    allowed_tools: ''
                  });
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Add New Coupon</span>
              </button>
            </div>

            {/* Coupon Form Modal */}
            {showCouponForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                    </h2>
                    <button onClick={() => setShowCouponForm(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitCoupon} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={couponForm.code}
                        onChange={handleCouponFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        placeholder="SUMMER2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type *
                      </label>
                      <select
                        name="discount_type"
                        value={couponForm.discount_type}
                        onChange={handleCouponFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Value * {couponForm.discount_type === 'percentage' ? '(%)' : '($)'}
                      </label>
                      <input
                        type="number"
                        name="discount_value"
                        value={couponForm.discount_value}
                        onChange={handleCouponFormChange}
                        required
                        min="0"
                        max={couponForm.discount_type === 'percentage' ? 100 : undefined}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Value ($)
                      </label>
                      <input
                        type="number"
                        name="min_order_value"
                        value={couponForm.min_order_value}
                        onChange={handleCouponFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses (leave empty for unlimited)
                      </label>
                      <input
                        type="number"
                        name="max_uses"
                        value={couponForm.max_uses}
                        onChange={handleCouponFormChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date (leave empty for no expiry)
                      </label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={couponForm.expiry_date}
                        onChange={handleCouponFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={couponForm.is_active}
                        onChange={handleCouponFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Coupon is active
                      </label>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-md font-semibold text-gray-700 mb-3">Restrictions (Optional)</h3>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Limit to Categories (leave empty for all categories)
                        </label>
                        <select
                          multiple
                          name="allowed_categories"
                          value={couponForm.allowed_categories ? couponForm.allowed_categories.split(',') : []}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                            const newCategories = selectedOptions.join(',');

                            // Filter out tools that are no longer in the selected categories
                            let newAllowedTools = couponForm.allowed_tools;
                            if (couponForm.allowed_tools && newCategories) {
                              const selectedToolIds = couponForm.allowed_tools.split(',').map(id => parseInt(id.trim()));
                              const filteredToolIds = selectedToolIds.filter(toolId => {
                                const tool = tools.find(t => t.id === toolId);
                                return tool && selectedOptions.includes(tool.category);
                              });
                              newAllowedTools = filteredToolIds.join(',');
                            }

                            setCouponForm({
                              ...couponForm,
                              allowed_categories: newCategories,
                              allowed_tools: newAllowedTools
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          size="4"
                        >
                          {getUniqueCategories().map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Hold Ctrl (Cmd on Mac) to select multiple categories
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Limit to Specific Tools (leave empty for all tools)
                        </label>
                        <select
                          multiple
                          name="allowed_tools"
                          value={couponForm.allowed_tools ? couponForm.allowed_tools.split(',') : []}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                            setCouponForm({
                              ...couponForm,
                              allowed_tools: selectedOptions.join(',')
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          size="6"
                        >
                          {tools
                            .filter(tool => {
                              // If no categories selected, show all tools
                              if (!couponForm.allowed_categories) return true;
                              // If categories selected, only show tools from those categories
                              const selectedCategories = couponForm.allowed_categories.split(',').map(c => c.trim());
                              return selectedCategories.includes(tool.category);
                            })
                            .map(tool => (
                              <option key={tool.id} value={tool.id}>
                                {tool.name} ({tool.category})
                              </option>
                            ))
                          }
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {couponForm.allowed_categories
                            ? `Showing tools from selected categories only. ${tools.filter(tool => {
                                const selectedCategories = couponForm.allowed_categories.split(',').map(c => c.trim());
                                return selectedCategories.includes(tool.category);
                              }).length} tool(s) available.`
                            : 'Hold Ctrl (Cmd on Mac) to select multiple tools'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                      >
                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCouponForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valid For
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Min. Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    // Get restriction info
                    const hasRestrictions = coupon.allowed_categories || coupon.allowed_tools;
                    let restrictionText = 'All Products';

                    if (hasRestrictions) {
                      const restrictions = [];
                      if (coupon.allowed_categories) {
                        const categories = coupon.allowed_categories.split(',').map(c => c.trim());
                        restrictions.push(`Categories: ${categories.join(', ')}`);
                      }
                      if (coupon.allowed_tools) {
                        const toolIds = coupon.allowed_tools.split(',').map(id => parseInt(id.trim()));
                        const toolNames = toolIds.map(id => {
                          const tool = tools.find(t => t.id === id);
                          return tool ? tool.name : `ID ${id}`;
                        });
                        restrictions.push(`Tools: ${toolNames.join(', ')}`);
                      }
                      restrictionText = restrictions.join(' | ');
                    }

                    return (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{coupon.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `$${coupon.discount_value}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className={hasRestrictions ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                          {restrictionText}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${coupon.min_order_value || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.used_count || 0}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ' / ∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.expiry_date
                          ? new Date(coupon.expiry_date).toLocaleDateString('en-GB')
                          : 'No expiry'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            coupon.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {coupons.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No coupons created yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toolsAPI, reservationsAPI, couponsAPI, packagesAPI, SERVER_BASE_URL } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Package, Calendar, Plus, Edit, Trash2, X, List, Tag, Settings, Upload } from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tools');
  const [tools, setTools] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [archivedReservations, setArchivedReservations] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [packageReservations, setPackageReservations] = useState([]);
  const [archivedPackageReservations, setArchivedPackageReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToolForm, setShowToolForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '', description: '', rental_type: 'by_date',
    price_per_day: '', fixed_price: '', image_url: '', is_available: true, tools: []
  });
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
    rental_type: 'by_date',
    price_per_day: '',
    fixed_price: '',
    description: '',
    image_url: '',
    stock: 5,
    is_available: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
      const [toolsRes, reservationsRes, archivedRes, couponsRes, pkgsRes] = await Promise.all([
        toolsAPI.getAll(),
        reservationsAPI.getAll(),
        reservationsAPI.getArchived(),
        couponsAPI.getAll(),
        packagesAPI.adminGetAll(),
      ]);
      setTools(toolsRes.data);
      setReservations(reservationsRes.data);
      setArchivedReservations(archivedRes.data);
      setCoupons(couponsRes.data);
      setPackages(pkgsRes.data);

      // Fetch package reservations separately so a failure here doesn't kill the whole dashboard
      let pkgResvsData = [];
      let pkgArchivedData = [];
      try {
        const [pkgResvsRes, pkgArchivedRes] = await Promise.all([
          packagesAPI.adminGetReservations(),
          packagesAPI.adminGetArchivedReservations(),
        ]);
        pkgResvsData = pkgResvsRes.data;
        pkgArchivedData = pkgArchivedRes.data;
      } catch (pkgErr) {
        console.error('Failed to fetch package reservations:', pkgErr);
      }
      setPackageReservations(pkgResvsData);
      setArchivedPackageReservations(pkgArchivedData);

      return { reservations: reservationsRes.data, tools: toolsRes.data, archived: archivedRes.data, coupons: couponsRes.data, pkgReservations: pkgResvsData };
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

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Clear the URL input when a file is selected
      setToolForm(prev => ({ ...prev, image_url: '' }));
    }
  };

  const clearImageFile = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const handleSubmitTool = async (e) => {
    e.preventDefault();
    try {
      let finalImageUrl = toolForm.image_url;

      // If there's a file to upload, upload it first
      if (imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadResponse = await toolsAPI.uploadImage(formData);
        finalImageUrl = `${SERVER_BASE_URL}${uploadResponse.data.imageUrl}`;
        setUploadingImage(false);
      }

      const toolData = { ...toolForm, image_url: finalImageUrl };

      if (editingTool) {
        await toolsAPI.update(editingTool.id, toolData);
        alert('Tool updated successfully');
      } else {
        await toolsAPI.create(toolData);
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
      clearImageFile();
      fetchData();
    } catch (error) {
      setUploadingImage(false);
      alert('Failed to save tool');
    }
  };

  const handleEditTool = (tool) => {
    setEditingTool(tool);
    setToolForm({
      name: tool.name,
      category: tool.category,
      rental_type: tool.rental_type || 'by_date',
      price_per_day: tool.price_per_day || '',
      fixed_price: tool.fixed_price || '',
      description: tool.description || '',
      image_url: tool.image_url || '',
      stock: tool.stock || 5,
      is_available: tool.is_available
    });
    clearImageFile();
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

  const handleCancelReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    try {
      if (isPackage) {
        await packagesAPI.adminArchive(reservationId);
      } else {
        await reservationsAPI.adminCancel(reservationId);
      }
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
      alert('Reservation cancelled successfully');
    } catch (error) {
      alert('Failed to cancel reservation');
    }
  };

  const handleMarkAsDelivered = async (reservationId, isPackage = false) => {
    if (!window.confirm('Mark this reservation as delivered?')) {
      return;
    }
    try {
      if (isPackage) {
        await packagesAPI.adminMarkDelivered(reservationId);
      } else {
        await reservationsAPI.markAsDelivered(reservationId);
      }
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
      alert('Reservation marked as delivered successfully');
    } catch (error) {
      alert('Failed to mark reservation as delivered');
    }
  };

  const handleMarkAsReturned = async (reservationId, isPackage = false) => {
    if (!window.confirm('Mark this reservation as returned?')) {
      return;
    }
    try {
      if (isPackage) {
        await packagesAPI.adminMarkReturned(reservationId);
      } else {
        await reservationsAPI.markAsReturned(reservationId);
      }
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
      alert('Reservation marked as returned successfully');
    } catch (error) {
      alert('Failed to mark reservation as returned');
    }
  };

  const handleArchiveReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('Move this reservation to Past Reservations?')) {
      return;
    }
    try {
      if (isPackage) {
        await packagesAPI.adminArchive(reservationId);
      } else {
        await reservationsAPI.archive(reservationId);
      }
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
      alert('Reservation moved to Past Reservations');
    } catch (error) {
      alert('Failed to archive reservation');
    }
  };

  const handleRestoreReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('Restore this reservation back to active view?')) {
      return;
    }
    try {
      if (isPackage) {
        await packagesAPI.adminRestore(reservationId);
        await fetchData();
        alert('Reservation restored successfully');
      } else {
        const response = await reservationsAPI.restore(reservationId);
        const freshData = await fetchData();
        updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
        alert(`Reservation restored successfully as ${response.data.status}`);
      }
    } catch (error) {
      alert('Failed to restore reservation');
    }
  };

  const handleDeleteReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('⚠️ WARNING: This will PERMANENTLY delete the reservation and cannot be undone!\n\nAre you sure you want to delete this reservation?')) {
      return;
    }
    try {
      if (isPackage) {
        await packagesAPI.adminDeleteReservation(reservationId);
      } else {
        await reservationsAPI.adminDelete(reservationId);
      }
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
      alert('Reservation permanently deleted');
    } catch (error) {
      alert('Failed to delete reservation');
    }
  };

  const handleMarkOverdue = async () => {
    try {
      const response = await reservationsAPI.markOverdue();
      const freshData = await fetchData();
      updateSelectedUser(freshData?.reservations, freshData?.pkgReservations);
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

  const normalizePackageReservation = (pr) => ({
    ...pr,
    is_package: true,
    tool_name: pr.package_name,
    tool_id: null,
    image_url: null,
  });

  // Group reservations by user
  const getUserGroups = (reservationsData = null, pkgData = null) => {
    const regularData = reservationsData || reservations;
    const pkgSource = pkgData !== null ? pkgData : packageReservations;
    const data = [...regularData, ...pkgSource.map(normalizePackageReservation)];
    const groups = {};
    data.forEach(res => {
      // Filter by user list search date if specified.
      // Null start_date (fixed-price packages) passes through the date filter always.
      if (userListSearchDate && res.start_date !== null && res.start_date !== userListSearchDate) {
        return;
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

  const updateSelectedUser = (freshReservations, freshPkgReservations) => {
    if (selectedUser && freshReservations) {
      const updatedGroups = getUserGroups(freshReservations, freshPkgReservations || []);
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

    // Filter by search date if specified; null-dated (fixed-price) items always pass through
    if (searchDate) {
      filtered = filtered.filter(r => !r.start_date || r.start_date === searchDate);
    }

    // Then sort by date if enabled
    if (!sortByDate) return filtered;
    return [...filtered].sort((a, b) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
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

  // Package handlers
  const handlePackageFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPackageForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const getFilteredToolsForPackage = () => {
    return tools.filter(t => t.rental_type === packageForm.rental_type);
  };

  const handlePackageToolQtyChange = (toolId, qty) => {
    const tool = tools.find(t => t.id === toolId);
    const capped = Math.max(1, Math.min(qty, tool?.stock || qty));
    setPackageForm(prev => {
      const existing = prev.tools.find(t => t.tool_id === toolId);
      if (existing) {
        return { ...prev, tools: prev.tools.map(t => t.tool_id === toolId ? { ...t, quantity: capped } : t) };
      }
      return { ...prev, tools: [...prev.tools, { tool_id: toolId, quantity: capped }] };
    });
  };

  const handlePackageToolToggle = (toolId) => {
    setPackageForm(prev => {
      const exists = prev.tools.find(t => t.tool_id === toolId);
      if (exists) {
        return { ...prev, tools: prev.tools.filter(t => t.tool_id !== toolId) };
      }
      return { ...prev, tools: [...prev.tools, { tool_id: toolId, quantity: 1 }] };
    });
  };

  const handleSubmitPackage = async (e) => {
    e.preventDefault();
    for (const pt of packageForm.tools) {
      const tool = tools.find(t => t.id === pt.tool_id);
      if (tool && pt.quantity > tool.stock) {
        alert(`"${tool.name}": quantity (${pt.quantity}) exceeds stock (${tool.stock})`);
        return;
      }
    }
    try {
      const data = {
        ...packageForm,
        price_per_day: packageForm.rental_type === 'by_date' ? parseFloat(packageForm.price_per_day) : null,
        fixed_price: packageForm.rental_type === 'fixed_price' ? parseFloat(packageForm.fixed_price) : null
      };
      if (editingPackage) {
        await packagesAPI.adminUpdate(editingPackage.id, data);
        alert('Package updated successfully');
      } else {
        await packagesAPI.adminCreate(data);
        alert('Package created successfully');
      }
      setShowPackageForm(false);
      setEditingPackage(null);
      setPackageForm({ name: '', description: '', rental_type: 'by_date', price_per_day: '', fixed_price: '', image_url: '', is_available: true, tools: [] });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save package');
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      rental_type: pkg.rental_type,
      price_per_day: pkg.price_per_day || '',
      fixed_price: pkg.fixed_price || '',
      image_url: pkg.image_url || '',
      is_available: Boolean(pkg.is_available),
      tools: (pkg.tools || []).map(t => ({ tool_id: t.tool_id, quantity: t.pkg_quantity }))
    });
    setShowPackageForm(true);
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await packagesAPI.adminDelete(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete package');
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
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">{t('adminDashboard')}</h1>
          <p className="text-brand-200">{t('manageToolsDesc')}</p>
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
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package size={20} />
              <span>{t('manageTools')}</span>
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'reservations'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={20} />
              <span>{t('viewReservations')}</span>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'archived'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Trash2 size={20} />
              <span>{t('pastReservations')}</span>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'coupons'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Tag size={20} />
              <span>{t('coupons')}</span>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold ${
                activeTab === 'packages'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Tag size={20} />
              <span>{t('packages')}</span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center space-x-2 px-6 py-4 font-semibold text-gray-600 hover:text-gray-800"
            >
              <Settings size={20} />
              <span>{t('settings')}</span>
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
                    rental_type: 'by_date',
                    price_per_day: '',
                    fixed_price: '',
                    description: '',
                    image_url: '',
                    stock: 5,
                    is_available: true
                  });
                  clearImageFile();
                }}
                className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
              >
                <Plus size={20} />
                <span>{t('addNewTool')}</span>
              </button>
            </div>

            {/* Tool Form Modal */}
            {showToolForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {editingTool ? t('editToolTitle') : t('addNewTool')}
                    </h2>
                    <button onClick={() => {
                      setShowToolForm(false);
                      clearImageFile();
                    }}>
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitTool} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('toolNameLabel')} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={toolForm.name}
                        onChange={handleToolFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('categoryLabel')} *
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={toolForm.category}
                        onChange={handleToolFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="e.g., Power Tools, Hand Tools, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('rentalType')} *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="rental_type"
                            value="by_date"
                            checked={toolForm.rental_type === 'by_date'}
                            onChange={handleToolFormChange}
                            className="text-brand-600"
                          />
                          <span className="text-sm">{t('byDateRental')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="rental_type"
                            value="fixed_price"
                            checked={toolForm.rental_type === 'fixed_price'}
                            onChange={handleToolFormChange}
                            className="text-brand-600"
                          />
                          <span className="text-sm">{t('fixedPriceRental')}</span>
                        </label>
                      </div>
                    </div>

                    {toolForm.rental_type === 'by_date' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricePerDay')} *
                      </label>
                      <input
                        type="number"
                        name="price_per_day"
                        value={toolForm.price_per_day}
                        onChange={handleToolFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    )}

                    {toolForm.rental_type === 'fixed_price' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('fixedPriceLabel')} *
                      </label>
                      <input
                        type="number"
                        name="fixed_price"
                        value={toolForm.fixed_price}
                        onChange={handleToolFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Total price for renting this item"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('oneTimePriceDesc')}</p>
                    </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('stockQuantity')} *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={toolForm.stock}
                        onChange={handleToolFormChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('stockQuantityDesc')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('description')}
                      </label>
                      <textarea
                        name="description"
                        value={toolForm.description}
                        onChange={handleToolFormChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('toolImage')}
                      </label>

                      {/* File Upload Option */}
                      <div className="mb-3">
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
                          <Upload size={20} className="mr-2 text-gray-500" />
                          <span className="text-gray-600">
                            {imageFile ? imageFile.name : t('clickToBrowseImg')}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                        {imageFile && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-green-600">{t('fileSelectedLabel')} {imageFile.name}</span>
                            <button
                              type="button"
                              onClick={clearImageFile}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              {t('remove')}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Image Preview */}
                      {(imagePreview || toolForm.image_url) && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 mb-1">{t('previewLabel')}</p>
                          <img
                            src={imagePreview || toolForm.image_url}
                            alt="Tool preview"
                            className="w-32 h-32 object-cover rounded border"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* URL Option */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">{t('orEnterUrl')}</span>
                        </div>
                      </div>
                      <input
                        type="url"
                        name="image_url"
                        value={toolForm.image_url}
                        onChange={(e) => {
                          handleToolFormChange(e);
                          // Clear file if URL is entered
                          if (e.target.value) {
                            clearImageFile();
                          }
                        }}
                        disabled={!!imageFile}
                        className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_available"
                        checked={toolForm.is_available}
                        onChange={handleToolFormChange}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        {t('toolAvailableLabel')}
                      </label>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={uploadingImage}
                        className="flex-1 bg-brand-600 text-white py-2 px-4 rounded hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed"
                      >
                        {uploadingImage ? t('uploadingImageText') : (editingTool ? t('updateTool') : t('createTool'))}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowToolForm(false);
                          clearImageFile();
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                      >
                        {t('cancel')}
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
                      {t('toolHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('categoryLabel')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('priceHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('stockHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('statusHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('actionsHeader')}
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
                        {tool.rental_type === 'fixed_price'
                          ? <><span className="text-xs bg-purple-100 text-purple-700 rounded px-1 mr-1">{t('fixedBadge')}</span>₪{tool.fixed_price}</>
                          : <>₪{tool.price_per_day}<span className="text-gray-400">/day</span></>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tool.stock || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tool.is_available ? (
                          <div className="flex flex-col">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                              {t('available')}
                            </span>
                            <span className="text-sm text-gray-600 mt-1">
                              {getAvailableQuantity(tool.id, tool.stock)} / {tool.stock} {t('inStockShort')}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {t('maintenance')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/admin/tools/${tool.id}/reservations`)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                        >
                          <List size={16} className="mr-1" />
                          {t('reservations')}
                        </button>
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="text-brand-600 hover:text-brand-900 inline-flex items-center"
                        >
                          <Edit size={16} className="mr-1" />
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          {t('delete')}
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
                  <h2 className="text-xl font-bold text-gray-800">{t('reservationsByUser')}</h2>
                  <p className="text-sm text-gray-600">{t('clickUserViewReservations')}</p>
                  <div className="flex items-center space-x-2 mt-3 text-sm">
                    <label htmlFor="userListSearchDate" className="font-medium">
                      {t('filterByStartDate')}
                    </label>
                    <input
                      id="userListSearchDate"
                      type="date"
                      value={userListSearchDate}
                      onChange={(e) => setUserListSearchDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {userListSearchDate && (
                      <button
                        onClick={() => setUserListSearchDate('')}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        {t('clearBtn')}
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
                          <div className="text-2xl font-bold text-brand-600">
                            {userGroup.reservations.length}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userGroup.reservations.length === 1 ? t('reservationSingular') : t('reservationPlural')}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {getUserGroups().length === 0 && (
                    <div className="px-6 py-12 text-center text-gray-500">
                      {t('noReservations')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* User Reservations Detail View */
              <div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mb-4 text-brand-600 hover:text-brand-800 flex items-center"
                >
                  <span className="mr-2">←</span> {t('backToUsersList')}
                </button>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-brand-50">
                    <h2 className="text-xl font-bold text-gray-800">{selectedUser.userName}</h2>
                    <p className="text-sm text-gray-600">{selectedUser.userEmail}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {t('totalReservationsColon')} {selectedUser.reservations.length}
                    </p>
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          filterStatus === 'all'
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {t('filterAll')} ({selectedUser.reservations.length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          filterStatus === 'active'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {t('statusActive')} ({selectedUser.reservations.filter(r => r.status === 'active').length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('overdue')}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          filterStatus === 'overdue'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {t('statusOverdue')} ({selectedUser.reservations.filter(r => r.status === 'overdue').length})
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
                        <span>{t('sortByStartDate')}</span>
                      </label>
                      <div className="flex items-center space-x-2 text-sm">
                        <label htmlFor="searchDate" className="font-medium">
                          {t('filterByStartDate')}
                        </label>
                        <input
                          id="searchDate"
                          type="date"
                          value={searchDate}
                          onChange={(e) => setSearchDate(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        {searchDate && (
                          <button
                            onClick={() => setSearchDate('')}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            {t('clearBtn')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('toolHeader')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('quantityHeader')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('availableHeader')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('datesHeader')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('priceHeader')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('statusHeader')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t('actionsHeader')}
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
                        <tr key={`${reservation.is_package ? 'pkg' : 'reg'}-${reservation.id}`} className={showWarning ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              {reservation.tool_name}
                              {reservation.is_package && (
                                <span className="text-xs bg-purple-100 text-purple-700 rounded px-1 font-semibold">Package</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{reservation.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {reservation.quantity || 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {reservation.is_package ? (
                              <span className="text-sm text-gray-400">—</span>
                            ) : (
                              <div className="flex flex-col">
                                <span className={`text-sm ${showWarning ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                  {availableQty} / {toolStock} {t('inStockShort')}
                                </span>
                                {showWarning && (
                                  <span className="text-xs text-red-600 font-semibold mt-1">
                                    {t('noStockToday')}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reservation.start_date
                              ? `${new Date(reservation.start_date).toLocaleDateString('en-GB')} - ${new Date(reservation.end_date).toLocaleDateString('en-GB')}`
                              : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₪{reservation.total_price}
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
                                    onClick={() => handleMarkAsDelivered(reservation.id, reservation.is_package)}
                                    className="text-green-600 hover:text-green-900 text-left"
                                  >
                                    {t('markDelivered')}
                                  </button>
                                  <button
                                    onClick={() => handleArchiveReservation(reservation.id, reservation.is_package)}
                                    className="text-gray-600 hover:text-gray-900 text-left"
                                  >
                                    {t('moveToPast')}
                                  </button>
                                </>
                              )}
                              {reservation.status === 'delivered' && (
                                <>
                                  <button
                                    onClick={() => handleMarkAsReturned(reservation.id, reservation.is_package)}
                                    className="text-brand-600 hover:text-brand-900 text-left"
                                  >
                                    {t('markReturned')}
                                  </button>
                                  <button
                                    onClick={() => handleArchiveReservation(reservation.id, reservation.is_package)}
                                    className="text-gray-600 hover:text-gray-900 text-left"
                                  >
                                    {t('moveToPast')}
                                  </button>
                                </>
                              )}
                              {reservation.status === 'overdue' && (
                                <button
                                  onClick={() => handleArchiveReservation(reservation.id, reservation.is_package)}
                                  className="text-gray-600 hover:text-gray-900 text-left"
                                >
                                  {t('moveToPast')}
                                </button>
                              )}
                              {reservation.status === 'returned' && (
                                <button
                                  onClick={() => handleArchiveReservation(reservation.id, reservation.is_package)}
                                  className="text-gray-600 hover:text-gray-900 text-left"
                                >
                                  {t('moveToPast')}
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
        {activeTab === 'archived' && (() => {
          const allArchived = [
            ...archivedReservations,
            ...archivedPackageReservations.map(normalizePackageReservation)
          ];
          return (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{t('pastReservations')}</h2>
              <p className="text-sm text-gray-600">{t('pastReservationsDesc')}</p>
              <p className="text-sm text-brand-600 mt-2">{t('totalReservationsLabel')} {allArchived.length}</p>
            </div>

            {allArchived.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Trash2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl">{t('noArchivedReservations')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('userHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('toolHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('quantityHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('datesHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('priceHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('actionsHeader')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allArchived.map((reservation) => (
                      <tr key={`${reservation.is_package ? 'pkg' : 'reg'}-${reservation.id}`} className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.user_name}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.user_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            {reservation.tool_name}
                            {reservation.is_package && (
                              <span className="text-xs bg-purple-100 text-purple-700 rounded px-1 font-semibold">Package</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {reservation.quantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.start_date
                            ? `${new Date(reservation.start_date).toLocaleDateString('en-GB')} - ${new Date(reservation.end_date).toLocaleDateString('en-GB')}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₪{reservation.total_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleRestoreReservation(reservation.id, reservation.is_package)}
                              className="text-brand-600 hover:text-brand-900 text-left"
                            >
                              {t('restoreToActive')}
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(reservation.id, reservation.is_package)}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              {t('deletePermanently')}
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
          );
        })()}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowPackageForm(true);
                  setEditingPackage(null);
                  setPackageForm({ name: '', description: '', rental_type: 'by_date', price_per_day: '', fixed_price: '', image_url: '', is_available: true, tools: [] });
                }}
                className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
              >
                <Plus size={20} />
                <span>{t('addNewPackage')}</span>
              </button>
            </div>

            {/* Package Form Modal */}
            {showPackageForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {editingPackage ? t('editPackageTitle') : t('addNewPackage')}
                    </h2>
                    <button onClick={() => setShowPackageForm(false)}><X size={24} /></button>
                  </div>
                  <form onSubmit={handleSubmitPackage} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('packageNameLabel')} *</label>
                      <input type="text" name="name" value={packageForm.name} onChange={handlePackageFormChange} required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('packageDescriptionLabel')}</label>
                      <textarea name="description" value={packageForm.description} onChange={handlePackageFormChange} rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('packageRentalTypeLabel')} *</label>
                      <select name="rental_type" value={packageForm.rental_type} onChange={e => { handlePackageFormChange(e); setPackageForm(prev => ({ ...prev, tools: [] })); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500">
                        <option value="by_date">{t('byDateRental')}</option>
                        <option value="fixed_price">{t('fixedPriceRental')}</option>
                      </select>
                    </div>
                    {packageForm.rental_type === 'by_date' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('packagePricePerDay')} *</label>
                        <input type="number" name="price_per_day" value={packageForm.price_per_day} onChange={handlePackageFormChange} min="0" step="0.01" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                    )}
                    {packageForm.rental_type === 'fixed_price' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('packageFixedPrice')} *</label>
                        <input type="number" name="fixed_price" value={packageForm.fixed_price} onChange={handlePackageFormChange} min="0" step="0.01" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('packageImageLabel')}</label>
                      <input type="url" name="image_url" value={packageForm.image_url} onChange={handlePackageFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="https://example.com/image.jpg" />
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" name="is_available" checked={packageForm.is_available} onChange={handlePackageFormChange}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                      <label className="ml-2 text-sm text-gray-900">{t('packageAvailableLabel')}</label>
                    </div>

                    {/* Tool selection */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{t('selectToolsLabel')}</h3>
                      <p className="text-xs text-gray-500 mb-3">{t('selectToolsHint')}</p>
                      {getFilteredToolsForPackage().length === 0 ? (
                        <p className="text-sm text-orange-600">{t('noToolsInCategory')}</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                          {getFilteredToolsForPackage().map(tool => {
                            const selected = packageForm.tools.find(t => t.tool_id === tool.id);
                            return (
                              <div key={tool.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                <input type="checkbox" checked={!!selected} onChange={() => handlePackageToolToggle(tool.id)}
                                  className="h-4 w-4 text-brand-600" />
                                <span className="flex-1 text-sm font-medium">{tool.name}</span>
                                <span className="text-xs text-brand-600 bg-brand-50 rounded px-1">{tool.category}</span>
                                <span className="text-xs text-gray-500">
                                  {tool.rental_type === 'fixed_price' ? `₪${tool.fixed_price}` : `₪${tool.price_per_day}/day`}
                                </span>
                                {selected && (
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-500">{t('qtyInPackage')}:</label>
                                    <input type="number" value={selected.quantity} min="1" max={tool.stock}
                                      onChange={e => handlePackageToolQtyChange(tool.id, parseInt(e.target.value) || 1)}
                                      className={`w-14 px-1 py-0.5 border rounded text-sm ${selected.quantity > tool.stock ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                                    <span className="text-xs text-gray-400">/{tool.stock}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {packageForm.tools.length > 0 && (
                        <p className="text-xs text-brand-600 mt-2 font-semibold">
                          {packageForm.tools.length} {t('toolsInPackage')}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button type="submit"
                        className="flex-1 bg-brand-600 text-white py-2 px-4 rounded hover:bg-brand-700">
                        {editingPackage ? t('updatePackage') : t('createPackage')}
                      </button>
                      <button type="button" onClick={() => setShowPackageForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400">
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Packages List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">{t('managePackages')}</h2>
              </div>
              {packages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>{t('noPackagesYet')}</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('packageNameHeader')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('rentalType')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('packagePriceHeader')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('packageToolsHeader')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('statusHeader')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actionsHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {packages.map(pkg => (
                      <tr key={pkg.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{pkg.name}</div>
                          {pkg.description && <div className="text-xs text-gray-500 mt-0.5">{pkg.description}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {pkg.rental_type === 'fixed_price' ? t('fixedPriceRental') : t('byDateRental')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {pkg.rental_type === 'fixed_price'
                            ? `₪${pkg.fixed_price}`
                            : `₪${pkg.price_per_day}/${t('day')}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(pkg.tools || []).map(t => `${t.tool_name} ×${t.pkg_quantity}`).join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${pkg.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {pkg.is_available ? t('packageAvailableStatus') : t('packageUnavailableStatus')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => handleEditPackage(pkg)} className="text-brand-600 hover:text-brand-900 inline-flex items-center">
                            <Edit size={16} className="mr-1" />{t('edit')}
                          </button>
                          <button onClick={() => handleDeletePackage(pkg.id)} className="text-red-600 hover:text-red-900 inline-flex items-center">
                            <Trash2 size={16} className="mr-1" />{t('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

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
                className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
              >
                <Plus size={20} />
                <span>{t('addNewCoupon')}</span>
              </button>
            </div>

            {/* Coupon Form Modal */}
            {showCouponForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {editingCoupon ? t('editCouponTitle') : t('addNewCoupon')}
                    </h2>
                    <button onClick={() => setShowCouponForm(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitCoupon} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('couponCodeLabel')} *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={couponForm.code}
                        onChange={handleCouponFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                        placeholder="SUMMER2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('discountTypeLabel')} *
                      </label>
                      <select
                        name="discount_type"
                        value={couponForm.discount_type}
                        onChange={handleCouponFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="percentage">{t('percentageLabel')}</option>
                        <option value="fixed">{t('fixedAmountLabel')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('discountValueLabel')} * {couponForm.discount_type === 'percentage' ? '(%)' : '(₪)'}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('minOrderValueLabel')}
                      </label>
                      <input
                        type="number"
                        name="min_order_value"
                        value={couponForm.min_order_value}
                        onChange={handleCouponFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('maxUsesLabel')}
                      </label>
                      <input
                        type="number"
                        name="max_uses"
                        value={couponForm.max_uses}
                        onChange={handleCouponFormChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('expiryDateLabel')}
                      </label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={couponForm.expiry_date}
                        onChange={handleCouponFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={couponForm.is_active}
                        onChange={handleCouponFormChange}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        {t('couponIsActiveLabel')}
                      </label>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-md font-semibold text-gray-700 mb-3">{t('restrictionsLabel')}</h3>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('limitToCategories')}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                          size="4"
                        >
                          {getUniqueCategories().map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('holdCtrlCategories')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('limitToTools')}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                            ? t('holdCtrlTools')
                            : t('holdCtrlTools')
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-brand-600 text-white py-2 px-4 rounded hover:bg-brand-700"
                      >
                        {editingCoupon ? t('updateCoupon') : t('createCoupon')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCouponForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                      >
                        {t('cancel')}
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
                      {t('codeHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('discountHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('validForHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('minOrderHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('usageHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('expiryHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('statusHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('actionsHeader')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    // Get restriction info
                    const hasRestrictions = coupon.allowed_categories || coupon.allowed_tools;
                    let restrictionText = t('allProducts');

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
                          : `₪${coupon.discount_value}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className={hasRestrictions ? 'text-brand-600 font-medium' : 'text-gray-500'}>
                          {restrictionText}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₪{coupon.min_order_value || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.used_count || 0}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ' / ∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.expiry_date
                          ? new Date(coupon.expiry_date).toLocaleDateString('en-GB')
                          : t('noExpiry')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            coupon.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {coupon.is_active ? t('activeLabel') : t('inactiveLabel')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-brand-600 hover:text-brand-900 inline-flex items-center"
                        >
                          <Edit size={16} className="mr-1" />
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          {t('delete')}
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
                  <p>{t('noCouponsYet')}</p>
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

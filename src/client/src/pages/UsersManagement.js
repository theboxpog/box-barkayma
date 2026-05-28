import React, { useState, useEffect } from 'react';
import { authAPI, reservationsAPI, toolsAPI, packagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Users, Trash2, Calendar, Shield, Tag } from 'lucide-react';

const UsersManagement = () => {
  const { t } = useLanguage();
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [archivedReservations, setArchivedReservations] = useState([]);
  const [packageReservations, setPackageReservations] = useState([]);
  const [archivedPackageReservations, setArchivedPackageReservations] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [userDetailsFilterStatus, setUserDetailsFilterStatus] = useState('all');
  const [userDetailsSortByDate, setUserDetailsSortByDate] = useState(true);
  const [userDetailsSearchDate, setUserDetailsSearchDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, reservationsRes, archivedRes, toolsRes] = await Promise.all([
        authAPI.getAllUsers(),
        reservationsAPI.getAll(),
        reservationsAPI.getArchived(),
        toolsAPI.getAll()
      ]);
      setUsers(usersRes.data);
      setReservations(reservationsRes.data);
      setArchivedReservations(archivedRes.data);
      setTools(toolsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }

    // Fetch package reservations separately so a failure here doesn't break the page
    let pkgData = [], pkgArchivedData = [];
    try {
      const [pkgRes, pkgArchivedRes] = await Promise.all([
        packagesAPI.adminGetReservations(),
        packagesAPI.adminGetArchivedReservations(),
      ]);
      pkgData = pkgRes.data;
      pkgArchivedData = pkgArchivedRes.data;
    } catch (pkgErr) {
      console.error('Failed to fetch package reservations:', pkgErr);
    }
    setPackageReservations(pkgData);
    setArchivedPackageReservations(pkgArchivedData);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await authAPI.deleteUser(userId);
      alert('User deleted successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId, userName, newRole) => {
    const roleLabels = { user: 'User', subadmin: 'Sub-Admin', admin: 'Admin' };
    if (!window.confirm(`Change ${userName}'s role to ${roleLabels[newRole]}?`)) {
      return;
    }

    try {
      await authAPI.updateUserRole(userId, newRole);
      alert(`${userName}'s role updated to ${roleLabels[newRole]}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleMarkAsDelivered = async (reservationId, isPackage = false) => {
    if (!window.confirm('Mark this reservation as delivered?')) return;
    try {
      if (isPackage) {
        await packagesAPI.adminMarkDelivered(reservationId);
      } else {
        await reservationsAPI.markAsDelivered(reservationId);
      }
      await fetchData();
      alert('Reservation marked as delivered successfully');
    } catch (error) {
      alert('Failed to mark reservation as delivered');
    }
  };

  const handleMarkAsReturned = async (reservationId, isPackage = false) => {
    if (!window.confirm('Mark this reservation as returned?')) return;
    try {
      if (isPackage) {
        await packagesAPI.adminMarkReturned(reservationId);
      } else {
        await reservationsAPI.markAsReturned(reservationId);
      }
      await fetchData();
      alert('Reservation marked as returned successfully');
    } catch (error) {
      alert('Failed to mark reservation as returned');
    }
  };

  const handleArchiveReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('Move this reservation to Past Reservations?')) return;
    try {
      if (isPackage) {
        await packagesAPI.adminArchive(reservationId);
      } else {
        await reservationsAPI.archive(reservationId);
      }
      await fetchData();
      alert('Reservation moved to Past Reservations');
    } catch (error) {
      alert('Failed to archive reservation');
    }
  };

  const handleRestoreReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('Restore this reservation back to active view?')) return;
    try {
      if (isPackage) {
        await packagesAPI.adminRestore(reservationId);
        await fetchData();
        alert('Reservation restored successfully');
      } else {
        const response = await reservationsAPI.restore(reservationId);
        await fetchData();
        alert(`Reservation restored successfully as ${response.data.status}`);
      }
    } catch (error) {
      alert('Failed to restore reservation');
    }
  };

  const handleDeleteReservation = async (reservationId, isPackage = false) => {
    if (!window.confirm('⚠️ WARNING: This will PERMANENTLY delete the reservation and cannot be undone!\n\nAre you sure you want to delete this reservation?')) return;
    try {
      if (isPackage) {
        await packagesAPI.adminDeleteReservation(reservationId);
      } else {
        await reservationsAPI.adminDelete(reservationId);
      }
      await fetchData();
      alert('Reservation permanently deleted');
    } catch (error) {
      alert('Failed to delete reservation');
    }
  };

  const normalizePackageReservation = (pr) => ({
    ...pr,
    is_package: true,
    tool_name: pr.package_name,
    tool_id: null,
  });

  const getAllUserReservations = (userId) => {
    const active = reservations.filter(r => r.user_id === userId);
    const archived = archivedReservations.filter(r => r.user_id === userId);
    const activePkg = packageReservations.filter(r => r.user_id === userId).map(normalizePackageReservation);
    return [...active, ...archived, ...activePkg];
  };

  // Sort and filter user details reservations
  const getSortedUserDetailsReservations = (userReservations) => {
    let filtered = userReservations;

    // Filter by status if not 'all'
    if (userDetailsFilterStatus !== 'all') {
      filtered = userReservations.filter(r => r.status === userDetailsFilterStatus);
    }

    // Filter by search date; null-date items (fixed-price packages) always pass through
    if (userDetailsSearchDate) {
      filtered = filtered.filter(r => !r.start_date || r.start_date === userDetailsSearchDate);
    }

    // Sort by date if enabled; null-date items go to end
    if (!userDetailsSortByDate) return filtered;
    return [...filtered].sort((a, b) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date) - new Date(b.start_date);
    });
  };

  // Calculate available quantity for a tool
  const getAvailableQuantity = (toolId, totalStock) => {
    const today = new Date().toISOString().split('T')[0];

    // Get all active, delivered, and overdue reservations for this tool
    const toolReservations = reservations.filter(
      r => r.tool_id === toolId && (r.status === 'active' || r.status === 'delivered' || r.status === 'overdue')
    );

    // Calculate currently reserved quantity
    const reservedQuantity = toolReservations.reduce((sum, r) => {
      if (r.status === 'active') {
        if (r.start_date <= today && r.end_date >= today) {
          return sum + (r.quantity || 1);
        }
      } else if (r.status === 'delivered') {
        return sum + (r.quantity || 1);
      } else if (r.status === 'overdue') {
        if (r.start_date <= today) {
          return sum + (r.quantity || 1);
        }
      }
      return sum;
    }, 0);

    return totalStock - reservedQuantity;
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
          <h1 className="text-4xl font-bold mb-2">{t('usersManagement')}</h1>
          <p className="text-brand-200">{t('viewAndManageUsers')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!selectedUserForDetails ? (
          /* Users List View */
          <div>
            {/* Search Bar */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('searchByNamePhone')}
              </label>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder={t('enterNameOrPhone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">{t('clickUserAllReservations')}</p>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('idHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nameHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('phoneNumber')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('roleHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('activeReservationsHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('createdAtHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actionsHeader')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users
                    .filter((user) => {
                      if (!userSearchTerm) return true;
                      const searchLower = userSearchTerm.toLowerCase();
                      return (
                        user.name.toLowerCase().includes(searchLower) ||
                        (user.phone_number && user.phone_number.includes(userSearchTerm))
                      );
                    })
                    .map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserForDetails(user)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phone_number || t('notAvailableText')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {isAdmin() && user.id !== currentUser?.id ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, user.name, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'subadmin'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            <option value="user">{t('userRoleLabel')}</option>
                            <option value="subadmin">{t('subAdminRoleLabel')}</option>
                            <option value="admin">{t('adminRoleLabel')}</option>
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'subadmin'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'subadmin' ? t('subAdminRoleLabel') : user.role === 'admin' ? t('adminRoleLabel') : t('userRoleLabel')}
                            {user.id === currentUser?.id && ` ${t('youSuffix')}`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.active_reservations_count > 0
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.active_reservations_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                        {user.active_reservations_count === 0 ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                          >
                            <Trash2 size={16} />
                            <span>{t('delete')}</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 flex items-center space-x-1" title="Cannot delete user with active reservations">
                            <Trash2 size={16} />
                            <span>{t('delete')}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>{t('noUsersFound')}</p>
                </div>
              )}
              {users.length > 0 &&
                users.filter((user) => {
                  if (!userSearchTerm) return true;
                  const searchLower = userSearchTerm.toLowerCase();
                  return (
                    user.name.toLowerCase().includes(searchLower) ||
                    (user.phone_number && user.phone_number.includes(userSearchTerm))
                  );
                }).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>{t('noUsersMatchSearch')}</p>
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="mt-2 text-brand-600 hover:text-brand-800 text-sm"
                    >
                      {t('clearSearch')}
                    </button>
                  </div>
                )}
            </div>
          </div>
        ) : (
          /* User Reservations Detail View */
          <div>
            <button
              onClick={() => {
                setSelectedUserForDetails(null);
                setUserDetailsFilterStatus('all');
                setUserDetailsSortByDate(true);
                setUserDetailsSearchDate('');
              }}
              className="mb-4 text-brand-600 hover:text-brand-800 flex items-center"
            >
              <span className="mr-2">←</span> {t('backToUsersList')}
            </button>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-brand-50">
                <h2 className="text-xl font-bold text-gray-800">{selectedUserForDetails.name}</h2>
                <p className="text-sm text-gray-600">{selectedUserForDetails.email}</p>
                <p className="text-sm text-gray-600">{t('phoneColon')} {selectedUserForDetails.phone_number || t('notAvailableText')}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('totalReservationsColon')} {getAllUserReservations(selectedUserForDetails.id).length}
                </p>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <button
                    onClick={() => setUserDetailsFilterStatus('all')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'all'
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('filterAll')} ({getAllUserReservations(selectedUserForDetails.id).length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('active')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('statusActive')} ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'active').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('delivered')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'delivered'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('statusDelivered')} ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'delivered').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('overdue')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'overdue'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('statusOverdue')} ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'overdue').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('returned')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'returned'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('statusReturned')} ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'returned').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('cancelled')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('statusCancelled')} ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'cancelled').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('archived')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'archived'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('statusArchived')} ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'archived').length})
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={userDetailsSortByDate}
                      onChange={(e) => setUserDetailsSortByDate(e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('sortByStartDate')}</span>
                  </label>
                  <div className="flex items-center space-x-2 text-sm">
                    <label htmlFor="userDetailsSearchDate" className="font-medium">
                      {t('filterByStartDate')}
                    </label>
                    <input
                      id="userDetailsSearchDate"
                      type="date"
                      value={userDetailsSearchDate}
                      onChange={(e) => setUserDetailsSearchDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {userDetailsSearchDate && (
                      <button
                        onClick={() => setUserDetailsSearchDate('')}
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
                      {t('paymentHeader')}
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
                  {getSortedUserDetailsReservations(getAllUserReservations(selectedUserForDetails.id)).map((reservation) => {
                    const tool = tools.find(t => t.id === reservation.tool_id);
                    const toolStock = tool?.stock || 0;
                    const isArchived = reservation.status === 'archived';
                    return (
                    <tr key={`${reservation.is_package ? 'pkg' : 'reg'}-${reservation.id}`} className={isArchived ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          {reservation.tool_name}
                          {reservation.is_package && (
                            <span className="text-xs bg-purple-100 text-purple-700 rounded px-1 font-semibold">
                              <Tag size={10} className="inline mr-0.5" />Package
                            </span>
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
                          <span className="text-sm text-gray-600">
                            {getAvailableQuantity(reservation.tool_id, toolStock)} / {toolStock} {t('inStockShort')}
                          </span>
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
                      <td className="px-6 py-4 text-sm">
                        {(() => {
                          const paid = reservation.paid_amount;
                          const original = reservation.total_price;
                          if (paid === null || paid === undefined) return <span className="text-gray-400">—</span>;
                          if (paid === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{t('couponFreeLabel')}</span>;
                          if (paid < original) return (
                            <div className="space-y-0.5">
                              <p className="text-gray-400 line-through text-xs">₪{original.toFixed(2)}</p>
                              <p className="text-green-600 text-xs">-₪{(original - paid).toFixed(2)} {t('couponLabel')}</p>
                              <p className="font-bold text-gray-900">₪{paid.toFixed(2)}</p>
                            </div>
                          );
                          return <span className="font-semibold text-gray-900">₪{paid.toFixed(2)}</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          {!isArchived && (
                            <>
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
                            </>
                          )}
                          {isArchived && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {getSortedUserDetailsReservations(getAllUserReservations(selectedUserForDetails.id)).length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-xl">{t('noReservations')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;

import React, { useState, useEffect } from 'react';
import { authAPI, reservationsAPI, toolsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Trash2, Calendar, Shield } from 'lucide-react';

const UsersManagement = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [archivedReservations, setArchivedReservations] = useState([]);
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

  const handleMarkAsDelivered = async (reservationId) => {
    if (!window.confirm('Mark this reservation as delivered?')) {
      return;
    }
    try {
      await reservationsAPI.markAsDelivered(reservationId);
      await fetchData();
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
      await fetchData();
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
      await fetchData();
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
      await fetchData();
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
      await fetchData();
      alert('Reservation permanently deleted');
    } catch (error) {
      alert('Failed to delete reservation');
    }
  };

  // Get all reservations for a specific user (both active and archived)
  const getAllUserReservations = (userId) => {
    const activeReservations = reservations.filter(r => r.user_id === userId);
    const archivedUserReservations = archivedReservations.filter(r => r.user_id === userId);
    return [...activeReservations, ...archivedUserReservations];
  };

  // Sort and filter user details reservations
  const getSortedUserDetailsReservations = (userReservations) => {
    let filtered = userReservations;

    // Filter by status if not 'all'
    if (userDetailsFilterStatus !== 'all') {
      filtered = userReservations.filter(r => r.status === userDetailsFilterStatus);
    }

    // Filter by search date if specified
    if (userDetailsSearchDate) {
      filtered = filtered.filter(r => r.start_date === userDetailsSearchDate);
    }

    // Sort by date if enabled
    if (!userDetailsSortByDate) return filtered;
    return [...filtered].sort((a, b) => {
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
          <h1 className="text-4xl font-bold mb-2">Users Management</h1>
          <p className="text-blue-100">View and manage all users</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!selectedUserForDetails ? (
          /* Users List View */
          <div>
            {/* Search Bar */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name or Phone Number
              </label>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Enter name or phone number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">Click on a user to view all their reservations</p>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Reservations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                        {user.phone_number || 'N/A'}
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
                            <option value="user">User</option>
                            <option value="subadmin">Sub-Admin</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'subadmin'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'subadmin' ? 'Sub-Admin' : user.role}
                            {user.id === currentUser?.id && ' (You)'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.active_reservations_count > 0
                            ? 'bg-blue-100 text-blue-800'
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
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 flex items-center space-x-1" title="Cannot delete user with active reservations">
                            <Trash2 size={16} />
                            <span>Delete</span>
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
                  <p>No users found</p>
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
                    <p>No users match your search</p>
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear search
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
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-2">←</span> Back to Users List
            </button>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-xl font-bold text-gray-800">{selectedUserForDetails.name}</h2>
                <p className="text-sm text-gray-600">{selectedUserForDetails.email}</p>
                <p className="text-sm text-gray-600">Phone: {selectedUserForDetails.phone_number || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Total Reservations: {getAllUserReservations(selectedUserForDetails.id).length}
                </p>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <button
                    onClick={() => setUserDetailsFilterStatus('all')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All ({getAllUserReservations(selectedUserForDetails.id).length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('active')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Active ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'active').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('delivered')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'delivered'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Delivered ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'delivered').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('overdue')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'overdue'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Overdue ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'overdue').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('returned')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'returned'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Returned ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'returned').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('cancelled')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancelled ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'cancelled').length})
                  </button>
                  <button
                    onClick={() => setUserDetailsFilterStatus('archived')}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      userDetailsFilterStatus === 'archived'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Archived ({getAllUserReservations(selectedUserForDetails.id).filter(r => r.status === 'archived').length})
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
                    <span>Sort by Start Date</span>
                  </label>
                  <div className="flex items-center space-x-2 text-sm">
                    <label htmlFor="userDetailsSearchDate" className="font-medium">
                      Filter by Start Date:
                    </label>
                    <input
                      id="userDetailsSearchDate"
                      type="date"
                      value={userDetailsSearchDate}
                      onChange={(e) => setUserDetailsSearchDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {userDetailsSearchDate && (
                      <button
                        onClick={() => setUserDetailsSearchDate('')}
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
                  {getSortedUserDetailsReservations(getAllUserReservations(selectedUserForDetails.id)).map((reservation) => {
                    const tool = tools.find(t => t.id === reservation.tool_id);
                    const toolStock = tool?.stock || 0;
                    const isArchived = reservation.status === 'archived';
                    return (
                    <tr key={reservation.id} className={isArchived ? 'bg-gray-50' : ''}>
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
                        <span className="text-sm text-gray-600">
                          {getAvailableQuantity(reservation.tool_id, toolStock)} / {toolStock} in stock
                        </span>
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
                          {!isArchived && (
                            <>
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
                            </>
                          )}
                          {isArchived && (
                            <>
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
                  <p className="text-xl">No reservations found</p>
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

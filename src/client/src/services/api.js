import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google/google', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  getAllUsers: () => api.get('/auth/users'),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  updateUserRole: (id, role) => api.put(`/auth/users/${id}/role`, { role })
};

// Tools API
export const toolsAPI = {
  getAll: (category) => api.get('/tools', { params: { category } }),
  getById: (id) => api.get(`/tools/${id}`),
  create: (data) => api.post('/tools', data),
  update: (id, data) => api.put(`/tools/${id}`, data),
  delete: (id) => api.delete(`/tools/${id}`),
  checkAvailability: (id, start, end, quantity, cartQuantity = 0) =>
    api.get(`/tools/${id}/availability`, { params: { start, end, quantity, cartQuantity } }),
  getAvailabilityByDate: (date) =>
    api.get('/tools/availability/date', { params: { date } })
};

// Reservations API
export const reservationsAPI = {
  create: (data) => api.post('/reservations', data),
  createBatch: (reservations) => api.post('/reservations/batch', { reservations }),
  getMy: () => api.get('/reservations/my'),
  getAll: (params) => api.get('/reservations/admin/all', { params }),
  getById: (id) => api.get(`/reservations/${id}`),
  cancel: (id) => api.delete(`/reservations/${id}`),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  updateStatus: (id, status) => api.patch(`/reservations/${id}/status`, { status }),
  adminCancel: (id) => api.post(`/reservations/${id}/cancel`),
  markAsDelivered: (id) => api.post(`/reservations/${id}/deliver`),
  markAsReturned: (id) => api.post(`/reservations/${id}/return`),
  adminDelete: (id) => api.delete(`/reservations/${id}/permanent`),
  userDelete: (id) => api.delete(`/reservations/${id}/user-delete`),
  markOverdue: () => api.post('/reservations/admin/mark-overdue'),
  getOverdue: () => api.get('/reservations/admin/overdue'),
  getActive: () => api.get('/reservations/admin/active'),
  archive: (id) => api.post(`/reservations/${id}/archive`),
  getArchived: () => api.get('/reservations/admin/archived'),
  restore: (id) => api.post(`/reservations/${id}/restore`)
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (reservationId, amount) =>
    api.post('/payments/create-payment-intent', { reservation_id: reservationId, amount }),
  confirmPayment: (paymentIntentId, reservationId) =>
    api.post('/payments/confirm', { payment_intent_id: paymentIntentId, reservation_id: reservationId }),
  getHistory: () => api.get('/payments/history'),
  getByReservation: (reservationId) => api.get(`/payments/reservation/${reservationId}`)
};

// Settings API
export const settingsAPI = {
  getRentalDays: () => api.get('/settings/rental-days'),
  updateRentalDays: (allowedDays) => api.put('/settings/rental-days', { allowedDays })
};

// Coupons API
export const couponsAPI = {
  validate: (code, orderValue, cartItems) => api.post('/coupons/validate', { code, orderValue, cartItems }),
  use: (id) => api.post(`/coupons/${id}/use`),
  getAll: () => api.get('/coupons/admin/all'),
  create: (data) => api.post('/coupons/admin', data),
  update: (id, data) => api.put(`/coupons/admin/${id}`, data),
  delete: (id) => api.delete(`/coupons/admin/${id}`)
};

export default api;

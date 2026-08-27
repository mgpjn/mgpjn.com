import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.mgpjn.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediglaxo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Catalog & Public Endpoints
export const getCategories = () => api.get('/categories');
export const getCategory = (idOrSlug) => api.get(`/categories/${idOrSlug}`);
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (idOrSlug) => api.get(`/products/${idOrSlug}`);
export const getFeaturedProducts = () => api.get('/products/featured');
export const getSearchSuggestions = (q) => api.get('/products/search-suggestions', { params: { q } });

// Cart & Orders & GST Invoice
export const createOrder = (orderData) => api.post('/orders', orderData);
export const getOrder = (id) => api.get(`/orders/${id}`);
export const getOrderInvoice = (id) => api.get(`/orders/${id}/invoice`);
export const trackOrder = (orderNumber) => api.get(`/orders/track/${orderNumber}`);
export const getUserOrders = () => api.get('/user/orders');
export const updateDeliveryStatus = (id, data) => api.post(`/orders/${id}/delivery-status`, data);

// Prescriptions
export const uploadPrescription = (data) => api.post('/prescriptions/upload', data);
export const getUserPrescriptions = () => api.get('/user/prescriptions');

// Auth
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.post('/auth/profile', data);
export const logoutUser = () => api.post('/auth/logout');

// Referral Income & Partner Portal
export const getMlmDashboard = () => api.get('/mlm/dashboard');
export const getGenealogyTree = () => api.get('/mlm/tree');
export const getDirectReferrals = (page = 1) => api.get(`/mlm/referrals?page=${page}`);
export const getCustomerOrders = (page = 1) => api.get(`/mlm/customer-orders?page=${page}`);
export const getMlmCommissions = (page = 1) => api.get(`/mlm/commissions?page=${page}`);
export const getWalletTransactions = (page = 1) => api.get(`/mlm/wallet?page=${page}`);
export const requestPayout = (payoutData) => api.post('/mlm/payout-request', payoutData);

// Admin Control Panel
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminCategories = () => api.get('/admin/categories');
export const storeAdminCategory = (data) => api.post('/admin/categories', data);
export const updateAdminCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteAdminCategory = (id) => api.delete(`/admin/categories/${id}`);
export const getAdminProducts = (params) => api.get('/admin/products', { params });
export const storeAdminProduct = (data) => api.post('/admin/products', data);
export const updateAdminProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) => api.delete(`/admin/products/${id}`);
export const getAdminOrders = (params) => api.get('/admin/orders', { params });
export const updateAdminOrderStatus = (id, data) => api.put(`/admin/orders/${id}`, data);
export const getAdminPrescriptions = (params) => api.get('/admin/prescriptions', { params });
export const updateAdminPrescriptionStatus = (id, data) => api.put(`/admin/prescriptions/${id}`, data);
export const getAdminPayouts = (params) => api.get('/admin/payouts', { params });
export const processAdminPayout = (id, data) => api.post(`/admin/payouts/${id}/process`, data);

// Super Admin Suite APIs
export const getAdminUsersByRole = (params) => api.get('/admin/users-by-role', { params });
export const storeAdminHierarchyUser = (data) => api.post('/admin/users', data);
export const updateAdminHierarchyUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const impersonateAdminUser = (id) => api.post(`/admin/users/${id}/impersonate`);

export const getAdminMargins = () => api.get('/admin/margins');
export const updateAdminMargins = (data) => api.post('/admin/margins', data);

export const getAdminTransfers = (params) => api.get('/admin/transfers', { params });
export const createAdminTransfer = (data) => api.post('/admin/transfers', data);

export const getAdminProductMargins = (params) => api.get('/admin/product-margins', { params });

export const getAdminBanners = () => api.get('/admin/banners');
export const storeAdminBanner = (data) => api.post('/admin/banners', data);
export const deleteAdminBanner = (id) => api.delete(`/admin/banners/${id}`);

export const getAdminReports = () => api.get('/admin/reports');

export const getAdminEmployees = () => api.get('/admin/employees');
export const storeAdminEmployee = (data) => api.post('/admin/employees', data);
export const updateAdminEmployee = (id, data) => api.put(`/admin/employees/${id}`, data);

export const getAdminSettings = () => api.get('/admin/settings');
export const updateAdminSettings = (data) => api.post('/admin/settings', data);

// 7-Tier Hierarchy APIs
export const getHierarchyUsers = (params) => api.get('/hierarchy/users', { params });
export const getAllowedRoles = () => api.get('/hierarchy/allowed-roles');
export const createHierarchyUser = (data) => api.post('/hierarchy/users', data);
export const updateHierarchyUser = (id, data) => api.put(`/hierarchy/users/${id}`, data);
export const getHierarchyStats = () => api.get('/hierarchy/stats');
export const getHierarchyOrders = (params) => api.get('/hierarchy/orders', { params });

// Super Admin User Controls & Approvals
export const resetAdminUserPassword = (id, data) => api.post(`/admin/users/${id}/reset-password`, data);
export const toggleAdminUserStatus = (id, data) => api.post(`/admin/users/${id}/toggle-status`, data);
export const transferAdminUser = (id, data) => api.post(`/admin/users/${id}/transfer`, data);
export const approveAdminUser = (id) => api.post(`/admin/users/${id}/approve`);
export const rejectAdminUser = (id, data) => api.post(`/admin/users/${id}/reject`, data);

// Product State-Wise Pricing
export const getAdminProductStatePrices = (id) => api.get(`/admin/products/${id}/state-prices`);
export const saveAdminProductStatePrices = (id, data) => api.post(`/admin/products/${id}/state-prices`, data);

// Medicine Purchase Orders (PO)
export const getPurchaseOrders = (params) => api.get('/purchase-orders', { params });
export const createPurchaseOrder = (data) => api.post('/purchase-orders', data);
export const getPurchaseOrder = (id) => api.get(`/purchase-orders/${id}`);
export const approvePurchaseOrder = (id, data) => api.post(`/purchase-orders/${id}/approve`, data);
export const rejectPurchaseOrder = (id, data) => api.post(`/purchase-orders/${id}/reject`, data);

export default api;

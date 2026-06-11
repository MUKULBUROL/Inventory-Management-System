import axios from 'axios';

// Get base URL from Vite env or fallback to relative URL using proxy
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productApi = {
  getAll: (search = '') => apiClient.get(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
  getById: (id) => apiClient.get(`/products/${id}`).then(r => r.data),
  create: (data) => apiClient.post('/products', data).then(r => r.data),
  update: (id, data) => apiClient.put(`/products/${id}`, data).then(r => r.data),
  delete: (id) => apiClient.delete(`/products/${id}`).then(r => r.data),
};

export const customerApi = {
  getAll: (search = '') => apiClient.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
  getById: (id) => apiClient.get(`/customers/${id}`).then(r => r.data),
  create: (data) => apiClient.post('/customers', data).then(r => r.data),
  delete: (id) => apiClient.delete(`/customers/${id}`).then(r => r.data),
};

export const orderApi = {
  getAll: () => apiClient.get('/orders').then(r => r.data),
  getById: (id) => apiClient.get(`/orders/${id}`).then(r => r.data),
  create: (data) => apiClient.post('/orders', data).then(r => r.data),
  delete: (id) => apiClient.delete(`/orders/${id}`).then(r => r.data),
};

export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard').then(r => r.data),
};

export const inventoryApi = {
  getLedger: (productId) => apiClient.get(`/inventory/events/${productId}`).then(r => r.data),
  adjustStock: (data) => apiClient.post('/inventory/adjust', data).then(r => r.data),
};

export default apiClient;

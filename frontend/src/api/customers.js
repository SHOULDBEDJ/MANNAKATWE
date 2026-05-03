import api from './client.js';
export const getCustomers = (params) => api.get('/api/customers', { params });
export const getCustomer = (id) => api.get(`/api/customers/${id}`);
export const createCustomer = (data) => api.post('/api/customers', data);
export const updateCustomer = (id, data) => api.put(`/api/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/api/customers/${id}`);

import api from './client.js';
export const getCustomerTypes = () => api.get('/api/customer-types');
export const createCustomerType = (data) => api.post('/api/customer-types', data);
export const updateCustomerType = (id, data) => api.put(`/api/customer-types/${id}`, data);
export const deleteCustomerType = (id) => api.delete(`/api/customer-types/${id}`);

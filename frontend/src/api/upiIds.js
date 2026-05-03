import api from './client.js';
export const getUpiIds = () => api.get('/api/upi-ids');
export const createUpiId = (data) => api.post('/api/upi-ids', data);
export const updateUpiId = (id, data) => api.put(`/api/upi-ids/${id}`, data);
export const deleteUpiId = (id) => api.delete(`/api/upi-ids/${id}`);

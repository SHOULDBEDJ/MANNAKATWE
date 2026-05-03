import api from './client.js';

export const getFunctionTypes = () => api.get('/api/function-types');
export const createFunctionType = (data) => api.post('/api/function-types', data);
export const updateFunctionType = (id, data) => api.put(`/api/function-types/${id}`, data);
export const deleteFunctionType = (id) => api.delete(`/api/function-types/${id}`);

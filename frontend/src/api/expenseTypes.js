import api from './client.js';

export const getExpenseTypes = () => api.get('/api/expense-types');
export const createExpenseType = (data) => api.post('/api/expense-types', data);
export const updateExpenseType = (id, data) => api.put(`/api/expense-types/${id}`, data);
export const deleteExpenseType = (id) => api.delete(`/api/expense-types/${id}`);

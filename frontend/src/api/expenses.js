import api from './client.js';

export const getExpenses = () => api.get('/api/expenses');
export const getExpense = (id) => api.get(`/api/expenses/${id}`);
export const createExpense = (data) => api.post('/api/expenses', data);
export const updateExpense = (id, data) => api.put(`/api/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/api/expenses/${id}`);

export const uploadExpensePhoto = (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/api/expenses/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

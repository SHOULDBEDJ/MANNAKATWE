import API from './client.js';

export const getCustomerHistory = (params) => API.get('/history/customers', { params });
export const getCustomerBookings = (id) => API.get(`/history/customers/${id}/bookings`);

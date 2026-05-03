import api from './client.js';
export const getKpis = () => api.get('/api/dashboard/kpis');
export const getCalendarBookings = (year, month) => api.get('/api/dashboard/calendar', { params: { year, month } });
export const getBookingsByDate = (date) => api.get('/api/dashboard/bookings-by-date', { params: { date } });
export const markOverdueDelivered = () => api.put('/api/dashboard/mark-overdue-delivered');
export const getRecentBookings = () => api.get('/api/dashboard/recent');

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api/auth';

export const login = (username, password) => axios.post(`${API_URL}/login`, { username, password });

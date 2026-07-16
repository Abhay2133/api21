import axios from 'axios';

// Base URL points to the API subdomain
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.abhaybisht.com/admin',
  withCredentials: true,
});

export default api;

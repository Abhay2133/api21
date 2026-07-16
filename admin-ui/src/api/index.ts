import axios from 'axios';

// Base URL points to the API subdomain
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.abhaybisht.com/admin',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminToken');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || '/api'
});

// Interceptor: Inyectar JWT en cada petición
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    if (config.headers.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Manejar errores de autenticación
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('ticket_user');
      // En modo history, redirigimos a la ruta absoluta
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

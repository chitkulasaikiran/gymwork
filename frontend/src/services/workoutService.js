import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

const workoutService = {
  createWorkout: (formData) =>
    API.post('/workouts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyWorkouts: () => API.get('/workouts'),
  getTodayWorkout: () => API.get('/workouts/today'),
  getWorkoutById: (id) => API.get(`/workouts/${id}`),
  updateWorkout: (id, formData) =>
    API.put(`/workouts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteWorkout: (id) => API.delete(`/workouts/${id}`),
};

export { authService, workoutService };

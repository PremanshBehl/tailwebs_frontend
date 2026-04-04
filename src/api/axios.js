import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
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

// Auth
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

// Assignments
export const fetchAssignments = (params) => API.get('/assignments', { params });
export const fetchAssignment = (id) => API.get(`/assignments/${id}`);
export const createAssignment = (data) => API.post('/assignments', data);
export const updateAssignment = (id, data) => API.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => API.delete(`/assignments/${id}`);
export const fetchSubmissionsForAssignment = (id) => API.get(`/assignments/${id}/submissions`);
export const fetchAnalytics = () => API.get('/assignments/analytics');

// Submissions
export const submitAnswer = (data) => API.post('/submissions', data);
export const fetchMySubmissions = () => API.get('/submissions/my');
export const markSubmissionReviewed = (id) => API.patch(`/submissions/${id}/review`);

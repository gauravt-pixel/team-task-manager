import axios from 'axios';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = RAW_URL.endsWith('/') ? RAW_URL.slice(0, -1) : RAW_URL;

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const updateMe = (data) => api.patch('/users/me', data);

// Projects
export const getProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);
export const getProject = (id) => api.get(`/projects/${id}`);
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addMember = (projectId, data) => api.post(`/projects/${projectId}/members`, data);
export const updateMemberRole = (projectId, memberId, data) => api.patch(`/projects/${projectId}/members/${memberId}`, data);
export const removeMember = (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`);

// Tasks
export const getTasks = (projectId, params) => api.get(`/tasks/projects/${projectId}/tasks`, { params });
export const createTask = (projectId, data) => api.post(`/tasks/projects/${projectId}/tasks`, data);
export const updateTask = (projectId, taskId, data) => api.patch(`/tasks/projects/${projectId}/tasks/${taskId}`, data);
export const deleteTask = (projectId, taskId) => api.delete(`/tasks/projects/${projectId}/tasks/${taskId}`);
export const getMyTasks = () => api.get('/tasks/my-tasks');

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentTasks = () => api.get('/dashboard/recent-tasks');

export default api;

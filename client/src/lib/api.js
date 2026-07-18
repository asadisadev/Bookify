import { getToken } from "./utils";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic API client with authentication
export const apiClient = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401/403 errors
      if (response.status === 401 || response.status === 403) {
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => 
    apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  login: (credentials) =>
    apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  getMe: () =>
    apiClient('/auth/me', {
      method: 'GET',
    }),
};

// Dashboard API
export const dashboardAPI = {
  getCustomerDashboard: () =>
    apiClient('/dashboard/customer'),
  
  getProfessionalDashboard: () =>
    apiClient('/dashboard/professional'),
  
  getAdminDashboard: () =>
    apiClient('/dashboard/admin'),
};

// Appointments API
export const appointmentAPI = {
  getMyAppointments: () =>
    apiClient('/appointments/my-appointments'),
  
  getAppointmentById: (id) =>
    apiClient(`/appointments/${id}`),
  
  createAppointment: (data) =>
    apiClient('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  cancelAppointment: (id) =>
    apiClient(`/appointments/${id}/cancel`, {
      method: 'PUT',
    }),
};
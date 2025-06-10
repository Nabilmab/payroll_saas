// frontend/src/services/apiService.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  // Auth
  LoginCredentials,
  LoginResponse,
  // User, // If you need to fetch current user profile
  // Salary Component
  SalaryComponent,
  SalaryComponentFormData,
  // Employee Salary Setting
  EmployeeSalarySetting,
  EmployeeSalarySettingFormData,
  // Employee
  Employee,
  // Utility
  UUID,
  ApiErrorResponse
} from '../types'; // Import your defined types

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Function to get the auth token (e.g., from localStorage or AuthContext)
const getAuthToken = (): string | null => {
  // Replace this with your actual token retrieval logic
  // For example, if you store it in localStorage after login:
  return localStorage.getItem('authToken');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling (optional but good)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle common errors globally or re-throw for specific component handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      // You could trigger a global notification here
      // e.g., if (error.response.status === 401) { logoutUser(); }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error); // Important to re-throw so components can catch it
  }
);


// --- Auth Service ---
export const login = (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> =>
  apiClient.post<LoginResponse>('/auth/login', credentials);

// In a real app, you'd also have:
// export const fetchCurrentUser = (): Promise<AxiosResponse<User>> => apiClient.get<User>('/auth/me');
// export const logout = (): Promise<AxiosResponse<void>> => apiClient.post<void>('/auth/logout');


// --- Salary Component Service ---
export const fetchSalaryComponents = (): Promise<AxiosResponse<SalaryComponent[]>> =>
  apiClient.get<SalaryComponent[]>('/salary-components');

export const createSalaryComponent = (data: SalaryComponentFormData): Promise<AxiosResponse<SalaryComponent>> =>
  apiClient.post<SalaryComponent>('/salary-components', data);

export const updateSalaryComponent = (id: UUID, data: Partial<SalaryComponentFormData>): Promise<AxiosResponse<SalaryComponent>> =>
  apiClient.put<SalaryComponent>(`/salary-components/${id}`, data);

export const deleteSalaryComponent = (id: UUID): Promise<AxiosResponse<void>> =>
  apiClient.delete<void>(`/salary-components/${id}`);


// --- Employee Service (Example) ---
export const fetchEmployeesForTenant = (): Promise<AxiosResponse<Employee[]>> =>
    apiClient.get<Employee[]>('/employees'); // Assuming /employees is protected and scoped by tenant via JWT


// --- Employee Salary Settings Service ---
export const fetchEmployeeSalarySettings = (employeeId: UUID): Promise<AxiosResponse<EmployeeSalarySetting[]>> =>
  apiClient.get<EmployeeSalarySetting[]>(`/employees/${employeeId}/salary-settings`);

export const addSalarySettingToEmployee = (employeeId: UUID, data: EmployeeSalarySettingFormData): Promise<AxiosResponse<EmployeeSalarySetting>> =>
  apiClient.post<EmployeeSalarySetting>(`/employees/${employeeId}/salary-settings`, data);

export const updateEmployeeSalarySetting = (employeeId: UUID, settingId: UUID, data: Partial<EmployeeSalarySettingFormData>): Promise<AxiosResponse<EmployeeSalarySetting>> =>
  apiClient.put<EmployeeSalarySetting>(`/employees/${employeeId}/salary-settings/${settingId}`, data);

export const removeSalarySettingFromEmployee = (employeeId: UUID, settingId: UUID): Promise<AxiosResponse<void>> =>
  apiClient.delete<void>(`/employees/${employeeId}/salary-settings/${settingId}`);

// Add other service functions for Departments, PaySchedules, PayrollRuns etc. as you build them.

export default apiClient; // Export the configured instance if needed directly elsewhere, though usually you use the functions.

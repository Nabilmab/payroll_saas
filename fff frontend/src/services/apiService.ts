// src/services/apiService.ts

import axios, { AxiosResponse } from 'axios';
import {
  User,
  SalaryComponent,
  SalaryComponentFormData,
  EmployeeSalarySetting,
  EmployeeSalarySettingFormData,
  Employee,
  UUID // Assuming UUID is exported from types.ts
} from '../types'; // Import your defined types

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const getAuthToken = (): string | null => localStorage.getItem('authToken');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {}; // Ensure headers object exists
    if(config.headers){ // Type guard for TypeScript
        config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Auth Service ---
interface LoginCredentials { email: string; password: string; }
interface LoginResponse { message: string; user: User; token?: string; /* Add token if you implement JWT */ }
export const loginUser = (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> =>
  apiClient.post('/auth/login', credentials);

// --- Salary Component Service ---
export const fetchSalaryComponents = (): Promise<AxiosResponse<SalaryComponent[]>> =>
  apiClient.get('/salary-components');

export const createSalaryComponent = (data: SalaryComponentFormData): Promise<AxiosResponse<SalaryComponent>> =>
  apiClient.post('/salary-components', data);

// For update, SalaryComponentFormData might be too strict if you only send partial data.
// Using Partial<SalaryComponentFormData> or a specific Update DTO is common.
export const updateSalaryComponent = (id: UUID, data: Partial<SalaryComponentFormData>): Promise<AxiosResponse<SalaryComponent>> =>
  apiClient.put(`/salary-components/${id}`, data);

export const deleteSalaryComponent = (id: UUID): Promise<AxiosResponse<void>> =>
  apiClient.delete(`/salary-components/${id}`);

// --- Employee Salary Settings Service ---
// Assuming employeeId is passed in the URL for these
export const fetchEmployeeSalarySettings = (employeeId: UUID): Promise<AxiosResponse<EmployeeSalarySetting[]>> =>
  apiClient.get(`/employees/${employeeId}/salary-settings`);

export const addSalarySettingToEmployee = (employeeId: UUID, data: EmployeeSalarySettingFormData): Promise<AxiosResponse<EmployeeSalarySetting>> =>
  apiClient.post(`/employees/${employeeId}/salary-settings`, data);

export const updateEmployeeSalarySetting = (employeeId: UUID, settingId: UUID, data: Partial<EmployeeSalarySettingFormData>): Promise<AxiosResponse<EmployeeSalarySetting>> =>
  apiClient.put(`/employees/${employeeId}/salary-settings/${settingId}`, data);

export const removeSalarySettingFromEmployee = (employeeId: UUID, settingId: UUID): Promise<AxiosResponse<void>> =>
  apiClient.delete(`/employees/${employeeId}/salary-settings/${settingId}`);

// --- Employee Service Example ---
export const fetchEmployees = (): Promise<AxiosResponse<Employee[]>> =>
  apiClient.get('/employees');

// Exporting the apiClient if it's needed directly elsewhere (e.g., for specific configurations)
export default apiClient;

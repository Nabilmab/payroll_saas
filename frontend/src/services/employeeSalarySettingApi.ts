// --- START OF NEW FILE ---
// ---
// frontend/src/services/employeeSalarySettingApi.ts
// ---
import { EmployeeSalarySetting, SalarySettingFormData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// In a real app, the token would be handled more robustly (e.g., via interceptors)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    // The backend's mock auth middleware does not require a real token,
    // but this is where it would go.
    ...(token && { 'Authorization': `Bearer ${token}` }), 
  };
};

/**
 * Fetches all active salary settings for a given employee.
 */
export const fetchEmployeeSalarySettings = async (employeeId: string): Promise<EmployeeSalarySetting[]> => {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/salary-settings`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch employee salary settings.');
  }
  return response.json();
};


/**
 * Adds a new salary setting to an employee.
 */
export const addEmployeeSalarySetting = async (employeeId: string, data: SalarySettingFormData): Promise<EmployeeSalarySetting> => {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/salary-settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add salary setting.');
    }
    return response.json();
};

/**
 * Updates an existing salary setting for an employee.
 */
export const updateEmployeeSalarySetting = async (employeeId: string, settingId: string, data: Partial<SalarySettingFormData>): Promise<EmployeeSalarySetting> => {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/salary-settings/${settingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update salary setting.');
    }
    return response.json();
};

/**
 * Deletes a salary setting from an employee's profile.
 */
export const deleteEmployeeSalarySetting = async (employeeId: string, settingId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/salary-settings/${settingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error ||'Failed to delete salary setting.');
  }
};
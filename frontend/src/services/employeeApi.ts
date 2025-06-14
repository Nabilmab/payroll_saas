// --- START OF CORRECTED FILE ---
// ---
// frontend/src/services/employeeApi.ts
// ---
import { Employee } from '../types';
import { EmployeeFormData } from '../features/employees/components/EmployeeModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: "An unknown error occurred." }));
        throw new Error(errorData.msg || errorData.error || 'An API error occurred.');
    }
    if (response.status === 204) { // No Content
        return;
    }
    return response.json();
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response);
};

export const fetchEmployeeById = async (id: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response);
};

export const addEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });
  return handleApiResponse(response);
};

export const updateEmployee = async (id: string, employeeData: Partial<EmployeeFormData>): Promise<Employee> => {
  // This is the corrected line
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });
  return handleApiResponse(response);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response);
};
// src/services/employeeApi.ts
import api from './api';
import { Employee } from '../types';
import { EmployeeFormData } from '../features/employees/components/EmployeeModal'; // Import form data type

export const fetchEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get('/employees');
  return data;
};

export const fetchEmployeeById = async (id: string): Promise<Employee> => {
  const { data } = await api.get(`/employees/${id}`);
  return data;
};

export const addEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  const { data } = await api.post('/employees', employeeData);
  return data;
};

export const updateEmployee = async (id: string, employeeData: EmployeeFormData): Promise<Employee> => {
  const { data } = await api.put(`/employees/${id}`, employeeData);
  return data;
};

// This performs a "soft delete" by updating the employee's status
export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/employees/${id}`);
};
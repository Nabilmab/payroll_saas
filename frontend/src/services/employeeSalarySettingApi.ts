// src/services/employeeSalarySettingApi.ts
import api from './api';
import { EmployeeSalarySetting, SalarySettingFormData } from '../types';

const BASE_URL = '/employees';

export const fetchEmployeeSalarySettings = async (employeeId: string): Promise<EmployeeSalarySetting[]> => {
  const { data } = await api.get(`${BASE_URL}/${employeeId}/salary-settings`);
  return data;
};

export const addEmployeeSalarySetting = async (
  employeeId: string,
  settingData: SalarySettingFormData
): Promise<EmployeeSalarySetting> => {
  const { data } = await api.post(`${BASE_URL}/${employeeId}/salary-settings`, settingData);
  return data;
};

// Note: The API for updating a salary setting might not be implemented yet.
// This is a placeholder for how it would look.
export const updateEmployeeSalarySetting = async (
  employeeId: string,
  settingId: string,
  settingData: SalarySettingFormData
): Promise<EmployeeSalarySetting> => {
  const { data } = await api.put(`${BASE_URL}/${employeeId}/salary-settings/${settingId}`, settingData);
  return data;
};

export const deleteEmployeeSalarySetting = async (
  employeeId: string,
  settingId: string
): Promise<void> => {
  await api.delete(`${BASE_URL}/${employeeId}/salary-settings/${settingId}`);
};
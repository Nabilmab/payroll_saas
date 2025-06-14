// src/services/salaryComponentApi.ts
import api from './api';
import { SalaryComponent, SalaryComponentFormData } from '../types';

export const fetchSalaryComponents = async (): Promise<SalaryComponent[]> => {
  const { data } = await api.get('/salary-components');
  return data;
};

export const addSalaryComponent = async (componentData: SalaryComponentFormData): Promise<SalaryComponent> => {
  const { data } = await api.post('/salary-components', componentData);
  return data;
};

export const updateSalaryComponent = async (id: string, componentData: SalaryComponentFormData): Promise<SalaryComponent> => {
  const { data } = await api.put(`/salary-components/${id}`, componentData);
  return data;
};

export const deleteSalaryComponent = async (id: string): Promise<void> => {
  await api.delete(`/salary-components/${id}`);
};

// This function just uses the standard update endpoint
export const toggleSalaryComponentActive = async (component: SalaryComponent): Promise<SalaryComponent> => {
  const payload = { isActive: !component.is_active };
  const { data } = await api.put(`/salary-components/${component.id}`, payload);
  return data;
};
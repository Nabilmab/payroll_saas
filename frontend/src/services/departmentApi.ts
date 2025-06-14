// src/services/departmentApi.ts
import api from './api';
import { Department } from '../types';

export const fetchDepartments = async (): Promise<Department[]> => {
  const { data } = await api.get('/departments');
  return data;
};
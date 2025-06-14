// src/services/authApi.ts
import api from './api';
import { LoginCredentials, LoginResponse } from '../types';

/**
 * Sends login credentials to the backend to authenticate a user.
 * @param credentials - The user's email and password.
 * @returns A promise that resolves to an object containing the JWT token.
 */
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
  return data;
};
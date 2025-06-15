// src/services/authApi.ts
import api from './api';
import { LoginCredentials, LoginResponse, SelectTenantResponse } from '../types';

/**
 * Sends login credentials. Stage 1 of auth.
 * @returns A promise that resolves to the user's core profile and a list of accessible tenants.
 */
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
  return data;
};

/**
 * Selects an active tenant for the session. Stage 2 of auth.
 * @param userId The ID of the user.
 * @param tenantId The ID of the tenant being selected.
 * @returns A promise that resolves to a session token and the user's full profile within the tenant context.
 */
export const selectTenant = async (userId: string, tenantId: string): Promise<SelectTenantResponse> => {
    const { data } = await api.post<SelectTenantResponse>('/auth/select-tenant', { userId, tenantId });
    return data;
}
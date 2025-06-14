// --- START OF NEW FILE ---
// ---
// frontend/src/services/departmentApi.ts
// ---
import { Department } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
 * Fetches all departments for the current tenant.
 * NOTE: The backend route for this does not exist yet. We will need to create it.
 * For now, this function is a placeholder for what we will build.
 */
export const fetchDepartments = async (): Promise<Department[]> => {
  // This route will be added to the backend in a later step.
  // For now, let's assume it exists and will be secured.
  const response = await fetch(`${API_BASE_URL}/departments`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch departments.');
  }
  return response.json();
};
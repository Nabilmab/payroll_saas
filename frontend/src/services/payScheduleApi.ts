// --- START OF NEW FILE ---
// ---
// frontend/src/services/payScheduleApi.ts
// ---
import { PaySchedule } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/**
 * Fetches all pay schedules for the current tenant.
 * NOTE: The backend route for this does not exist yet. We will create it.
 */
export const fetchPaySchedules = async (): Promise<PaySchedule[]> => {
  const response = await fetch(`${API_BASE_URL}/pay-schedules`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch pay schedules.');
  }
  return response.json();
};
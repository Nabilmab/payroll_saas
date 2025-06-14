// --- START OF UPDATED FILE ---
// ---
// frontend/src/services/authApi.ts
// ---
import { LoginCredentials, LoginResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    // The backend error for login is in 'msg', not 'error'
    throw new Error(data.msg || 'Login failed.');
  }
  
  return data;
};
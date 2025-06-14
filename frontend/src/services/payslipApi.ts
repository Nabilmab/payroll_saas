// --- START OF NEW FILE ---
// ---
// frontend/src/services/payslipApi.ts
// ---
import { Payslip } from '../types';

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
        throw new Error(errorData.error || errorData.msg || 'An API error occurred.');
    }
    return response.json();
};

/**
 * Fetches all payslips for a given payroll run.
 */
export const fetchPayslipsForRun = async (runId: string): Promise<Payslip[]> => {
    const response = await fetch(`${API_BASE_URL}/payslips/for-run/${runId}`, {
        headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
};

/**
 * Fetches the full details of a single payslip.
 */
export const fetchPayslipById = async (payslipId: string): Promise<Payslip> => {
    const response = await fetch(`${API_BASE_URL}/payslips/${payslipId}`, {
        headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
};
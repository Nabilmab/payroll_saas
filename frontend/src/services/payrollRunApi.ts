// --- START OF NEW FILE ---
// ---
// frontend/src/services/payrollRunApi.ts
// ---
import { PayrollRun } from '../types'; // We will add this type definition next

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
        throw new Error(errorData.msg || errorData.error || 'An API error occurred.');
    }
    return response.json();
};

/**
 * Fetches all payroll runs for the tenant.
 */
export const fetchPayrollRuns = async (): Promise<PayrollRun[]> => {
    const response = await fetch(`${API_BASE_URL}/payroll-runs`, {
        headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
};

/**
 * Starts a new payroll run.
 */
export interface StartPayrollRunPayload {
    payScheduleId: string;
    periodEndDate: string;
    paymentDate: string;
}

export const startPayrollRun = async (payload: StartPayrollRunPayload): Promise<{ payrollRun: PayrollRun }> => {
    const response = await fetch(`${API_BASE_URL}/payroll-runs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleApiResponse(response);
};
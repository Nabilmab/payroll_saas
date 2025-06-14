// src/services/payrollRunApi.ts
import api from './api';
import { PayrollRun } from '../types';

export interface StartPayrollRunPayload {
    payScheduleId: string;
    periodEndDate: string;
    paymentDate: string;
}

export const fetchPayrollRuns = async (): Promise<PayrollRun[]> => {
    const { data } = await api.get('/payroll-runs');
    return data;
};

export const startPayrollRun = async (payload: StartPayrollRunPayload): Promise<{ payrollRun: PayrollRun }> => {
    const { data } = await api.post('/payroll-runs', payload);
    return data;
};
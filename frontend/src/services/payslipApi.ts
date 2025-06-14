// src/services/payslipApi.ts
import api from './api';
import { Payslip } from '../types';

export const fetchPayslipsForRun = async (runId: string): Promise<Payslip[]> => {
    const { data } = await api.get(`/payslips/for-run/${runId}`);
    return data;
};

export const fetchPayslipById = async (payslipId: string): Promise<Payslip> => {
    const { data } = await api.get(`/payslips/${payslipId}`);
    return data;
};
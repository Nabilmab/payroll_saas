// src/services/payScheduleApi.ts
import api from './api';
import { PaySchedule } from '../types';

export const fetchPaySchedules = async (): Promise<PaySchedule[]> => {
    const { data } = await api.get('/pay-schedules');
    return data;
};
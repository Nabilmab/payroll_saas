import api from './api';

// You can define a proper type for this later
export const fetchTenantUsers = async (): Promise<any[]> => {
  const { data } = await api.get('/admin/users');
  return data;
};

export const fetchTenantRoles = async (): Promise<any[]> => {
    const { data } = await api.get('/admin/roles');
    return data;
};

export interface InviteUserData {
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
}
export const inviteUser = async (userData: InviteUserData): Promise<any> => {
    const { data } = await api.post('/admin/invite', userData);
    return data;
};

export const updateUserRole = async (userId: string, roleId: string): Promise<any> => {
    const { data } = await api.put(`/admin/users/${userId}/role`, { roleId });
    return data;
};

// --- ADD THIS FUNCTION ---
export const removeUserAccess = async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
};
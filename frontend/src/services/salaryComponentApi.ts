// frontend/src/services/salaryComponentApi.ts
import axios from 'axios';
import { SalaryComponent, SalaryComponentFormData } from '../types'; // Adjusted path based on typical structure

// Define your API base URL.
// In a real application, this would come from an environment variable.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Authorization headers would be set here once authentication is implemented
    // e.g., 'Authorization': `Bearer ${token}`
  },
});

// Interceptor to handle errors globally or transform responses if needed
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle errors more globally here if desired
    // For now, we'll let the calling code handle specific errors
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

/**
 * Fetches all salary components (system-defined and tenant-specific).
 */
export const fetchSalaryComponents = async (): Promise<SalaryComponent[]> => {
  try {
    const response = await apiClient.get<SalaryComponent[]>('/salary-components');
    return response.data;
  } catch (error) {
    // The interceptor already logs, re-throw for page-level handling
    throw error;
  }
};

/**
 * Adds a new salary component.
 * @param componentData - The data for the new salary component.
 */
export const addSalaryComponent = async (componentData: SalaryComponentFormData): Promise<SalaryComponent> => {
  try {
    // The backend expects `amount` for fixed and `percentage` for percentage type.
    // The backend also expects `default_amount` in some places, let's align with the model fields directly.
    const payload = {
        name: componentData.name,
        description: componentData.description,
        type: componentData.type,
        calculation_type: componentData.calculation_type,
        // The backend uses 'amount' for fixed values based on the model.
        // It uses 'percentage' for percentage values.
        // The SalaryComponentFormData should already be structured like this from the modal.
        amount: componentData.calculation_type === 'fixed' ? componentData.amount : null,
        percentage: componentData.calculation_type === 'percentage' ? componentData.percentage : null,
        is_taxable: componentData.is_taxable,
        payslip_display_order: componentData.payslip_display_order,
        // Backend handles is_system_defined, is_active on creation.
    };
    const response = await apiClient.post<SalaryComponent>('/salary-components', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Updates an existing salary component.
 * @param id - The ID of the salary component to update.
 * @param componentData - The data to update.
 */
export const updateSalaryComponent = async (id: string, componentData: SalaryComponentFormData): Promise<SalaryComponent> => {
  try {
    // Similar to add, ensure payload aligns with backend expectations for PUT
     const payload = {
        name: componentData.name,
        description: componentData.description,
        type: componentData.type,
        calculation_type: componentData.calculation_type,
        amount: componentData.calculation_type === 'fixed' ? componentData.amount : null,
        percentage: componentData.calculation_type === 'percentage' ? componentData.percentage : null,
        is_taxable: componentData.is_taxable,
        is_active: componentData.id ? undefined : true, // is_active can be sent for updates. If editing, we might send it from page for toggle.
                                                       // For now, let's assume the modal sends the core editable fields.
                                                       // The PUT endpoint in server.js handles 'is_active' if sent.
        payslip_display_order: componentData.payslip_display_order,
    };
    const response = await apiClient.put<SalaryComponent>(`/salary-components/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes a salary component.
 * @param id - The ID of the salary component to delete.
 */
export const deleteSalaryComponent = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/salary-components/${id}`);
  } catch (error) {
    throw error;
  }
};

/**
 * Toggles the active status of a salary component.
 * This is a common operation, so it might warrant its own function or be part of update.
 * For simplicity, we can use the general updateSalaryComponent for this if the backend supports partial updates for `is_active`.
 * The backend PUT /api/salary-components/:componentId does handle `is_active`.
 */
export const toggleSalaryComponentActive = async (component: SalaryComponent): Promise<SalaryComponent> => {
    try {
        const payload = {
            is_active: !component.is_active,
            // Send other fields as they are, or let backend handle merging if it's a true PATCH
            // For now, sending what the modal would send for an update.
            // A more specific PATCH endpoint for only `is_active` might be better.
            // Our current PUT acts like a PATCH for defined fields.
            name: component.name,
            description: component.description,
            type: component.type,
            calculation_type: component.calculation_type,
            amount: component.calculation_type === 'fixed' ? component.amount : null,
            percentage: component.calculation_type === 'percentage' ? component.percentage : null,
            is_taxable: component.is_taxable,
            payslip_display_order: component.payslip_display_order,
        };
        const response = await apiClient.put<SalaryComponent>(`/salary-components/${component.id}`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

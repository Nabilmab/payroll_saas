// src/types.ts

// --- Basic Types ---
export type UUID = string;

// --- Tenant ---
export interface Tenant {
  id: UUID;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  schema_name: string; // From your model
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// --- Role ---
export interface Role {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string | null;
  // ... other fields
}

// --- User ---
export interface User {
  id: UUID;
  tenantId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending_verification';
  // password_hash is excluded by defaultScope
  // ... other fields
  roles?: Role[]; // If you fetch roles with the user
}

// --- Salary Component ---
export type SalaryComponentType = 'earning' | 'deduction';
export type CalculationType = 'fixed' | 'percentage' | 'formula'; // Keep for system components

export interface SalaryComponent {
  id: UUID;
  tenantId?: UUID | null; // Null for system-defined
  name: string;
  description?: string | null;
  type: SalaryComponentType;
  calculation_type: CalculationType; // Will be 'fixed' for tenant-created in Phase 2
  default_amount?: number | null; // This corresponds to 'amount' in our backend model
  is_taxable: boolean;
  is_system_defined: boolean;
  is_active: boolean;
  payslip_display_order?: number | null;
  // For later:
  // component_code?: string | null;
  // is_cnss_subject?: boolean;
  // is_amo_subject?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// --- Employee ---
export interface Department { // Assuming a simple Department structure for now
    id: UUID;
    name: string;
    // ... other department fields
}
export interface Employee {
    id: UUID;
    tenantId: UUID;
    departmentId?: UUID | null;
    userId?: UUID | null;
    first_name: string;
    last_name: string;
    email?: string | null;
    job_title?: string | null;
    hire_date: string; // DATEONLY, typically string 'YYYY-MM-DD'
    status: 'active' | 'on_leave' | 'terminated' | 'pending_hire';
    // ... other fields
    department?: Department; // From include
    // employeeSalarySettings will be fetched separately or included
}


// --- Employee Salary Setting ---
export interface EmployeeSalarySetting {
  id: UUID;
  tenantId: UUID;
  employeeId: UUID;
  salaryComponentId: UUID;
  amount?: number | null; // Employee-specific override
  effective_date: string; // DATEONLY
  is_active: boolean;
  salaryComponent?: SalaryComponent; // From include
  createdAt?: string;
  updatedAt?: string;
}

// --- API Payloads (Examples) ---
export interface SalaryComponentFormData {
  name: string;
  description?: string;
  type: SalaryComponentType;
  default_amount?: number; // This corresponds to 'amount' in our backend model for creation/update
  is_taxable: boolean;
  payslip_display_order?: number;
  // For later, if tenant admins can set these (likely not for component_code):
  // component_code?: string;
  // is_cnss_subject?: boolean;
  // is_amo_subject?: boolean;
  // is_active will be handled by a separate toggle endpoint for existing, true for new
}

export interface EmployeeSalarySettingFormData {
  salaryComponentId: UUID;
  amount?: number;
  effective_date: string; // e.g., 'YYYY-MM-DD'
  is_active: boolean;
}

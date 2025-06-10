// frontend/src/types/index.ts

// --- Basic Utility Types ---
export type UUID = string;
export type IsoDateString = string; // To represent dates formatted as ISO strings (e.g., "2024-06-11T10:00:00.000Z")

// --- API Error Structure (Example) ---
export interface ApiErrorResponse {
  error: string;
  message?: string; // Optional more detailed message
  details?: any;    // Optional additional error details
}

// --- Tenant ---
export interface Tenant {
  id: UUID;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'trial'; // Added 'trial' from earlier model
  schema_name: string; // As per your model
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
}

// --- Role ---
export interface Role {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
}

// --- User ---
// This is the User object you might receive AFTER login (password_hash excluded)
export interface User {
  id: UUID;
  tenantId: UUID;
  firstName: string; // Was first_name in some backend models, ensure consistency
  lastName: string;  // Was last_name in some backend models, ensure consistency
  email: string;
  status: 'active' | 'inactive' | 'pending_verification' | 'invited' | 'deactivated'; // Combined statuses
  last_login_at?: IsoDateString | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
  roles?: Role[]; // If you decide to send roles with the user object
}

// --- Department ---
export interface Department {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string | null;
  // managerId?: UUID | null; // If you add manager to department
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
}

// --- Salary Component ---
export type SalaryComponentType = 'earning' | 'deduction';
export type SalaryComponentCalculationType = 'fixed' | 'percentage' | 'formula';

export interface SalaryComponent {
  id: UUID;
  tenantId?: UUID | null; // Null for system-defined
  name: string;
  description?: string | null;
  type: SalaryComponentType;
  calculation_type: SalaryComponentCalculationType;
  default_amount?: number | null;
  percentage?: number | null;          // For system percentage components
  basedOnComponentId?: UUID | null;    // For system percentage components
  formula_json?: Record<string, any> | null; // For system formula components
  is_taxable: boolean;
  is_system_defined: boolean;
  is_active: boolean;
  payslip_display_order?: number | null;
  component_code?: string | null;      // For system components like 'BASE_SALARY_MONTHLY'
  is_cnss_subject?: boolean;
  is_amo_subject?: boolean;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
}

// --- Employee ---
export interface Employee {
  id: UUID;
  tenantId: UUID;
  departmentId?: UUID | null;
  userId?: UUID | null;
  employee_id_alt?: string | null; // From your model
  first_name: string;
  last_name: string;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null; // Added from seed data discussion
  job_title?: string | null;
  date_of_birth?: IsoDateString | null; // Should be DATEONLY string 'YYYY-MM-DD' from backend
  hire_date: IsoDateString;         // Should be DATEONLY string 'YYYY-MM-DD' from backend
  termination_date?: IsoDateString | null; // Should be DATEONLY string 'YYYY-MM-DD' from backend
  status: 'active' | 'on_leave' | 'terminated' | 'pending_hire';
  reportingManagerId?: UUID | null; // Renamed from your seed, ensure model matches
  payScheduleId?: UUID | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
  // Included data
  department?: Department;
  // userAccount?: User; // if you include user for employee
  // employeeSalarySettings?: EmployeeSalarySetting[]; // Usually fetched separately
}

// --- Employee Salary Setting ---
export interface EmployeeSalarySetting {
  id: UUID;
  tenantId: UUID;
  employeeId: UUID;
  salaryComponentId: UUID;
  amount?: number | null; // Employee-specific override for fixed amounts
  percentage?: number | null; // Employee-specific override for percentage amounts (Phase 3+)
  effective_date: IsoDateString; // DATEONLY string 'YYYY-MM-DD'
  is_active: boolean;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
  // Included data
  salaryComponent?: SalaryComponent;
}


// --- API Request/Response Payloads (Forms etc.) ---

// For Auth
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface LoginResponse {
  message: string;
  user: User;
  token: string; // Assuming JWT token is returned on login
}

// For SalaryComponent CRUD
export interface SalaryComponentFormData {
  name: string;
  description?: string;
  type: SalaryComponentType;
  // For Phase 2, tenant-created are 'fixed'
  // calculation_type: SalaryComponentCalculationType; // Not set by tenant in Phase 2 for custom
  default_amount?: number;
  is_taxable: boolean;
  payslip_display_order?: number;
  // is_active is handled by a separate toggle or on update
}

// For EmployeeSalarySetting CRUD
export interface EmployeeSalarySettingFormData {
  salaryComponentId: UUID; // Which component to assign
  amount?: number;         // Override amount for this employee (for fixed components)
  // percentage?: number;  // For Phase 3+
  effective_date: string; // 'YYYY-MM-DD'
  is_active: boolean;
}

// Add other types as needed: PaySchedule, PayrollRun, Payslip, PayslipItem etc.

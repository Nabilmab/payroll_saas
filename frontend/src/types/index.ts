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
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  schema_name: string;
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
export interface User {
  id: UUID;
  tenantId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending_verification' | 'invited' | 'deactivated';
  last_login_at?: IsoDateString | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
  roles?: Role[];
}

// --- Department ---
export interface Department {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
}

// --- Salary Component (Corrected as per subtask) ---
export interface SalaryComponent {
  id: string; // UUID is string, so this is fine
  tenantId?: string | null; // UUID is string
  name: string;
  description?: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage' | 'formula'; // Key field
  amount?: number | null;
  percentage?: number | null;
  is_taxable: boolean;
  is_active: boolean;
  is_system_defined: boolean;
  payslip_display_order?: number | null;
  component_code?: string | null;
  is_cnss_subject?: boolean; // Added as per definition
  is_amo_subject?: boolean;  // Added as per definition
  // Removed: default_amount (replaced by amount), basedOnComponentId, formula_json
  // Added (if they were missing, though they seem to align with original model): createdAt, updatedAt, deletedAt
  createdAt?: IsoDateString; // Ensuring these are present if part of a full model
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
}

// --- Employee ---
export interface Employee {
  id: UUID;
  tenantId: UUID;
  departmentId?: UUID | null;
  userId?: UUID | null;
  employee_id_alt?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  job_title?: string | null;
  date_of_birth?: IsoDateString | null;
  hire_date: IsoDateString;
  termination_date?: IsoDateString | null;
  status: 'active' | 'on_leave' | 'terminated' | 'pending_hire';
  reportingManagerId?: UUID | null;
  payScheduleId?: UUID | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
  department?: Department;
}

// --- Employee Salary Setting ---
export interface EmployeeSalarySetting {
  id: UUID;
  tenantId: UUID;
  employeeId: UUID;
  salaryComponentId: UUID;
  amount?: number | null;
  percentage?: number | null;
  effective_date: IsoDateString;
  is_active: boolean;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
  deletedAt?: IsoDateString | null;
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
  token: string;
}

// For SalaryComponent CRUD (Corrected as per subtask)
export type SalaryComponentFormData = {
  id?: string; // Optional ID for updates
  name: string;
  description?: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage'; // Key field
  amount?: number | null;
  percentage?: number | null;
  is_taxable: boolean;
  payslip_display_order?: number | null;
  // Removed: default_amount (replaced by amount)
  // Removed: commented out calculation_type, is_active (as per provided definition)
};

// For EmployeeSalarySetting CRUD
export interface EmployeeSalarySettingFormData {
  salaryComponentId: UUID;
  amount?: number;
  effective_date: string;
  is_active: boolean;
}

// Add other types as needed: PaySchedule, PayrollRun, Payslip, PayslipItem etc.

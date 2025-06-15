// src/types/index.ts

export interface Jurisdiction {
  id: string;
  name: string;
  currency: string;
  locale: string;
}

export interface Tenant {
  id: string;
  name: string;
  schemaName: string;
  jurisdiction: Jurisdiction;
  userRole?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  tenantId: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  hireDate: string; // ISO 8601 date string
  terminationDate?: string | null;
  status: 'active' | 'on_leave' | 'terminated' | 'pending_hire';
  tenantId: string;
  departmentId?: string | null;
  department?: Department; // For included relations
}

export interface SalaryComponent {
  id: string;
  name: string;
  description?: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  amount?: number | null;
  percentage?: number | null;
  is_taxable: boolean;
  is_active: boolean;
  is_system_defined: boolean;
  payslip_display_order?: number | null;
  tenantId?: string | null;
}

// Form data for creating/updating a salary component
export interface SalaryComponentFormData {
  id?: string;
  name: string;
  description?: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage';
  amount?: number | null;
  percentage?: number | null;
  is_taxable: boolean;
  payslip_display_order?: number | null;
}

export interface EmployeeSalarySetting {
    id: string;
    employeeId: string;
    salaryComponentId: string;
    amount?: number | null;
    percentage?: number | null;
    effectiveDate: string; // ISO 8601 date string
    isActive: boolean;
    salaryComponent: SalaryComponent; // Included relation
}

export interface SalarySettingFormData {
    id?: string;
    salaryComponentId: string;
    effectiveDate: string;
    amount?: number | null;
    percentage?: number | null;
}

export interface PaySchedule {
    id: string;
    name: string;
    frequency: 'monthly' | 'weekly' | 'bi-weekly';
    // Add other fields if needed
}

export interface PayrollRun {
    id: string;
    periodStart: string;
    periodEnd: string;
    paymentDate: string;
    status: 'processing' | 'completed' | 'paid';
    totalNetPay: string; // Prisma Decimal is a string in JSON
    totalEmployees: number;
}

export interface PayslipItem {
    id: string;
    description: string;
    type: 'earning' | 'deduction' | 'tax';
    amount: string; // Prisma Decimal is a string in JSON
    salaryComponent: SalaryComponent;
}

export interface Payslip {
    id: string;
    grossPay: string;
    deductions: string;
    taxes: string;
    netPay: string;
    employee: Employee;
    payrollRun: PayrollRun;
    payslipItems: PayslipItem[];
}

// --- Authentication Types ---

export interface LoginCredentials {
    email: string;
    password: string;
}

// This is the base user profile, without any tenant context.
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

// This is the object that will be stored in our UserContext and localStorage.
// It represents the user AND their active session.
export interface UserContextProfile extends UserProfile {
    tenant: Tenant & {
        userRole: {
            id: string;
            name: string;
        }
    }
}

// The response from POST /api/auth/login
export interface LoginResponse {
    user: UserProfile; // Returns the base user profile
    tenants: Tenant[];
}

// The response from POST /api/auth/select-tenant
export interface SelectTenantResponse {
    token: string;
    user: UserContextProfile; // Returns the full user profile with context
}
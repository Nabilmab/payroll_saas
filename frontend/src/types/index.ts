// --- START OF UPDATED FILE ---
// ---
// frontend/src/types/index.ts
// ---
// No mongoose import should be here.

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id:string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending_verification';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  departmentId?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  status: 'active' | 'on_leave' | 'terminated';
  hireDate: string;
  department?: Department;
  dependents?: EmployeeDependent[];
}

export interface EmployeeDependent {
    id: string;
    tenantId: string;
    employeeId: string;
    fullName: string;
    relationship: 'spouse' | 'child' | 'other_relative';
    dateOfBirth?: string;
    isFiscallyDependent: boolean;
}

export interface SalaryComponent {
  id: string;
  tenantId: string | null;
  name:string;
  description: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  amount: number | null;
  percentage: number | null;
  is_taxable: boolean;
  is_active: boolean;
  is_system_defined: boolean;
  payslip_display_order: number | null;
}

export interface SalaryComponentFormData {
  id?: string;
  name: string;
  description: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage';
  is_taxable: boolean;
  payslip_display_order?: number;
  amount: number | null;
  percentage: number | null;
}

export interface EmployeeSalarySetting {
  id: string;
  employeeId: string;
  salaryComponentId: string;
  effectiveDate: string;
  amount: number | null;
  percentage: number | null;
  isActive: boolean;
  salaryComponent?: SalaryComponent;
  createdAt: string;
  updatedAt: string;
}

export interface SalarySettingFormData {
  id?: string;
  salaryComponentId: string;
  effectiveDate: string;
  amount?: number | null;
  percentage?: number | null;
  isActive?: boolean;
}

export interface PaySchedule {
    id: string;
    tenantId: string;
    name: string;
    frequency: 'monthly' | 'weekly' | 'bi_weekly' | 'semi_monthly';
    payDayOfMonth?: number;
    // ... other fields as needed
}

export interface PayrollRun {
    id: string;
    tenantId: string;
    payScheduleId: string;
    periodStart: string;
    periodEnd: string;
    paymentDate: string;
    status: string; // e.g., 'processing', 'completed', 'failed'
    totalGrossPay: string; // Comes as a string from DECIMAL type
    totalDeductions: string;
    totalNetPay: string;
    totalEmployees: number;
    createdAt: string;
}

export interface PayslipItem {
    id: string;
    description: string;
    type: 'earning' | 'deduction' | 'tax' | 'reimbursement';
    amount: string; // Comes as a string from DECIMAL
    salaryComponent: SalaryComponent;
}

export interface Payslip {
    id: string;
    grossPay: string;
    deductions: string;
    taxes: string;
    netPay: string;
    employee?: Employee; // Included from API
    payrollRun: PayrollRun; // Included from API
    payslipItems: PayslipItem[]; // Included from API
}
// src/types/index.ts

// Using camelCase to match Prisma's JSON output
export interface Tenant {
  id: string;
  name: string;
  description?: string | null;
  schemaName: string;
  status: string;
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

// --- ✅ FIX: Add these missing authentication types ---
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}
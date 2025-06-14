// frontend/src/types.ts
export interface SalaryComponent {
  id: string; name: string; description?: string | null; type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage' | 'formula'; amount?: number | null; percentage?: number | null;
  isTaxable: boolean; isActive: boolean; isSystemDefined: boolean; payslipDisplayOrder?: number | null;
}
export interface SalaryComponentFormData {
  id?: string; name: string; description: string | null; type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage' | 'formula'; amount: number | null; percentage: number | null;
  isTaxable: boolean; payslipDisplayOrder?: number | undefined;
}
export interface Employee {
  id: string; firstName: string; lastName: string; email: string; jobTitle: string; hireDate: string;
  status: 'active' | 'on_leave' | 'terminated' | 'pending_hire';
  department?: { id: string; name: string; }; // This will now be populated correctly
  departmentId?: string; dependents: any[];
}
export interface SalaryComponent {
  id: string; // UUID
  tenantId?: string | null; // UUID
  name: string;
  description?: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  amount?: number | null; // Decimal
  percentage?: number | null; // Decimal
  // basedOnComponentId?: string | null; // UUID
  // formula_json?: any | null; // JSONB
  is_taxable: boolean;
  is_active: boolean;
  is_system_defined: boolean;
  payslip_display_order?: number | null;
  component_code?: string | null;
  is_cnss_subject: boolean;
  is_amo_subject: boolean;
  // order?: number | null;
  createdAt?: string; // Date
  updatedAt?: string; // Date
  deletedAt?: string | null; // Date
}

export type SalaryComponentPayload = Omit<
  SalaryComponent,
  'id' | 'is_system_defined' | 'tenantId' | 'is_cnss_subject' | 'is_amo_subject' | 'component_code' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

// Added SalaryComponentFormData type
export type SalaryComponentFormData = {
  name: string;
  description?: string | null;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage'; // As per specific requirement for FormData
  amount?: number | null;
  percentage?: number | null;
  is_taxable: boolean;
  is_active: boolean;
  payslip_display_order?: number | null;
  // Note: Fields like id, tenantId, is_system_defined etc., are typically excluded from form data for creation/update
};

// src/components/SalaryComponentList.tsx

import React, { FC } from 'react';
import { SalaryComponent } from '../types';

interface SalaryComponentListProps {
  components: SalaryComponent[];
  onEdit: (component: SalaryComponent) => void;
  onDelete: (id: string) => void;
  onToggleActive: (component: SalaryComponent) => void;
}

const SalaryComponentList: FC<SalaryComponentListProps> = ({ components, onEdit, onDelete, onToggleActive }) => {
  // Basic inline styles for table (replace with proper CSS/styling solution)
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };
  const thStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
  };
  const tdStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    padding: '8px',
  };
  const buttonStyle: React.CSSProperties = {
    marginRight: '5px',
    padding: '5px 10px',
    cursor: 'pointer',
  };

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Type</th>
          <th style={thStyle}>Default Amount</th>
          <th style={thStyle}>Taxable</th>
          <th style={thStyle}>Active</th>
          <th style={thStyle}>System-Defined</th>
          <th style={thStyle}>Display Order</th>
          <th style={thStyle}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {components.length === 0 ? (
          <tr>
            <td colSpan={8} style={{...tdStyle, textAlign: 'center'}}>No salary components found.</td>
          </tr>
        ) : (
          components.map(component => (
            <tr key={component.id}>
              <td style={tdStyle}>{component.name}</td>
              <td style={tdStyle}>{component.type}</td>
              <td style={tdStyle}>
                {/* default_amount in SalaryComponent type corresponds to 'amount' in our backend model */}
                {component.default_amount !== null && component.default_amount !== undefined
                  ? component.default_amount.toFixed(2)
                  : 'N/A'}
              </td>
              <td style={tdStyle}>{component.is_taxable ? 'Yes' : 'No'}</td>
              <td style={tdStyle}>
                {component.is_system_defined ? (
                  component.is_active ? 'Yes' : 'No'
                ) : (
                  <button
                    onClick={() => onToggleActive(component)}
                    style={{...buttonStyle, backgroundColor: component.is_active ? '#ffcccc' : '#ccffcc'}}
                  >
                    {component.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </td>
              <td style={tdStyle}>{component.is_system_defined ? 'Yes' : 'No'}</td>
              <td style={tdStyle}>{component.payslip_display_order ?? 'N/A'}</td>
              <td style={tdStyle}>
                {!component.is_system_defined && (
                  <>
                    <button onClick={() => onEdit(component)} style={buttonStyle}>Edit</button>
                    <button onClick={() => onDelete(component.id)} style={{...buttonStyle, backgroundColor: '#ffcccc'}}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default SalaryComponentList;

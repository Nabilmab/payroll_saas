// src/components/SalaryComponentModal.tsx

import React, { useState, useEffect, FC } from 'react';
import { SalaryComponent, SalaryComponentFormData, SalaryComponentType } from '../types'; // Your defined types

interface SalaryComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalaryComponentFormData) => Promise<void>; // onSubmit is now async
  initialData?: SalaryComponent | null;
}

const SalaryComponentModal: FC<SalaryComponentModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SalaryComponentType>('earning');
  const [defaultAmount, setDefaultAmount] = useState<string>(''); // Store as string for input field
  const [isTaxable, setIsTaxable] = useState(false);
  const [payslipDisplayOrder, setPayslipDisplayOrder] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) { // Ensure initialData is applied only when modal is open and data exists
      setName(initialData.name);
      setDescription(initialData.description || '');
      setType(initialData.type);
      // default_amount in SalaryComponent type corresponds to 'amount' in our backend model
      setDefaultAmount(initialData.default_amount?.toString() || '');
      setIsTaxable(initialData.is_taxable);
      setPayslipDisplayOrder(initialData.payslip_display_order?.toString() || '');
    } else if (!initialData && isOpen) { // Reset form for new entry when modal opens without initialData
      setName('');
      setDescription('');
      setType('earning');
      setDefaultAmount('');
      setIsTaxable(false);
      setPayslipDisplayOrder('');
    }
  }, [initialData, isOpen]); // Re-populate if initialData changes or modal re-opens

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData: SalaryComponentFormData = {
      name,
      description: description || undefined, // Send undefined if empty
      type,
      // default_amount in SalaryComponentFormData corresponds to 'amount' in our backend model
      default_amount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      is_taxable: isTaxable,
      payslip_display_order: payslipDisplayOrder ? parseInt(payslipDisplayOrder, 10) : undefined,
    };
    try {
      await onSubmit(formData);
      onClose(); // Close modal on successful submission
    } catch (error) {
      console.error("Submission error:", error);
      // Handle error display to user (e.g., set an error message in state)
      // For now, error is logged, and modal stays open for correction.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Basic inline styles for modal (replace with proper CSS/styling solution)
  const modalBackdropStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  };
  const modalContentStyle: React.CSSProperties = {
    background: 'white', padding: '20px', borderRadius: '5px',
    minWidth: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };
  const formFieldStyle: React.CSSProperties = { marginBottom: '10px' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px' };
  const inputStyle: React.CSSProperties = { width: 'calc(100% - 10px)', padding: '8px', marginBottom: '5px' };
  const buttonContainerStyle: React.CSSProperties = { marginTop: '15px', textAlign: 'right' };


  return (
    <div style={modalBackdropStyle} onClick={onClose}> {/* Close on backdrop click */}
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}> {/* Prevent content click from closing */}
        <h2>{initialData ? 'Edit' : 'Create'} Salary Component</h2>
        <form onSubmit={handleSubmit}>
          <div style={formFieldStyle}>
            <label htmlFor="name" style={labelStyle}>Name:</label>
            <input type="text" id="name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="description" style={labelStyle}>Description:</label>
            <textarea id="description" style={{...inputStyle, height: '60px'}} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="type" style={labelStyle}>Type:</label>
            <select id="type" style={inputStyle} value={type} onChange={e => setType(e.target.value as SalaryComponentType)} required>
              <option value="earning">Earning</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="defaultAmount" style={labelStyle}>Default Amount (Fixed Amount):</label>
            <input type="number" step="0.01" id="defaultAmount" style={inputStyle} value={defaultAmount} onChange={e => setDefaultAmount(e.target.value)} />
          </div>
          <div style={formFieldStyle}>
            <label style={labelStyle}>
              <input type="checkbox" checked={isTaxable} onChange={e => setIsTaxable(e.target.checked)} style={{marginRight: '5px'}}/>
              Is Taxable?
            </label>
          </div>
           <div style={formFieldStyle}>
            <label htmlFor="payslipDisplayOrder" style={labelStyle}>Display Order:</label>
            <input type="number" id="payslipDisplayOrder" style={inputStyle} value={payslipDisplayOrder} onChange={e => setPayslipDisplayOrder(e.target.value)} />
          </div>
          <div style={buttonContainerStyle}>
            <button type="submit" disabled={isSubmitting} style={{marginRight: '10px'}}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryComponentModal;

// src/pages/SalaryComponentsPage.tsx

import React, { useState, useEffect, FC } from 'react';
import { SalaryComponent, SalaryComponentFormData } from '../types';
import {
  fetchSalaryComponents,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent
} from '../services/apiService';
import SalaryComponentList from '../components/SalaryComponentList'; // Adjusted path
import SalaryComponentModal from '../components/SalaryComponentModal'; // Adjusted path

const SalaryComponentsPage: FC = () => {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);

  const loadComponents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchSalaryComponents();
      setComponents(response.data);
    } catch (err) {
      setError('Failed to load salary components.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingComponent(null);
    setShowModal(true);
  };

  const handleEdit = (component: SalaryComponent) => {
    setEditingComponent(component);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingComponent(null);
  };

  const handleSubmitModal = async (data: SalaryComponentFormData) => {
    try {
      if (editingComponent) {
        // The API expects default_amount, which maps to 'amount' in our backend model
        await updateSalaryComponent(editingComponent.id, data);
      } else {
        await createSalaryComponent(data);
      }
      loadComponents(); // Refetch after create/update
      // Modal's internal logic will call onClose on successful submission passed via its onSubmit prop
    } catch (apiError: any) {
      console.error("API submission error:", apiError);
      const errorMessage = apiError.response?.data?.error || 'Failed to save component.';
      alert(errorMessage); // Simple alert, improve with a notification system
      throw apiError; // Re-throw to let modal know submission failed & stay open
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      try {
        await deleteSalaryComponent(id);
        loadComponents();
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete component.';
        setError(errorMessage);
        console.error(err);
      }
    }
  };

  const handleToggleActive = async (component: SalaryComponent) => {
    // Ensure we are only trying to update 'is_active'
    const updateData: Partial<SalaryComponentFormData> = {
      // We must provide a 'name' and 'type' if not allowing truly partial updates on backend for these fields,
      // or if SalaryComponentFormData is too strict.
      // For now, we assume the backend PUT /api/salary-components/:id can handle a partial update
      // with just 'is_active'. If it requires other fields, this needs adjustment.
      // The user's example SalaryComponentFormData doesn't have is_active.
      // The SalaryComponent type *does* have is_active.
      // The API PUT /api/salary-components expects Partial<SalaryComponentFormData>.
      // We need to ensure that if we send { is_active: ... }, it's a valid partial update.
      // Let's assume SalaryComponentFormData is primarily for create, and for update,
      // the backend can handle partials including fields not explicitly in SalaryComponentFormData like is_active.
      // A more robust way is to have a specific DTO for updates or ensure backend handles this flexibility.

      // Based on the current setup, to update 'is_active', we might need to send other required fields
      // from 'SalaryComponentFormData' or adjust the DTO/backend.
      // Let's try sending only 'is_active' and see if the API (as defined in apiService.ts with Partial<SalaryComponentFormData>)
      // and the backend controller can handle it.
      // The backend PUT handler for SalaryComponent was defined to update fields like:
      // if (is_active !== undefined) component.is_active = !!is_active;
      // This means sending just { is_active: ... } should work.
      is_active: !component.is_active
    };

    try {
        await updateSalaryComponent(component.id, updateData as any);
        // Using 'as any' here because `is_active` is not in `SalaryComponentFormData`.
        // A better solution would be to have a more flexible update DTO or ensure
        // `SalaryComponentFormData` includes all updatable fields or backend is robust.
        loadComponents();
    } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to update component status.';
        setError(errorMessage);
        console.error(err);
    }
  };

  // Basic inline styles for page container (replace with proper CSS/styling solution)
  const pageStyle: React.CSSProperties = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  };
  const buttonStyle: React.CSSProperties = {
    padding: '10px 15px',
    marginBottom: '20px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
  };

  return (
    <div style={pageStyle}>
      <h1>Salary Component Management</h1>
      <button onClick={handleOpenCreateModal} style={buttonStyle}>Create New Component</button>
      {isLoading && <p>Loading components...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!isLoading && !error && (
        <SalaryComponentList
          components={components}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}
      {showModal && (
        <SalaryComponentModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmitModal}
          initialData={editingComponent}
        />
      )}
    </div>
  );
};

export default SalaryComponentsPage;

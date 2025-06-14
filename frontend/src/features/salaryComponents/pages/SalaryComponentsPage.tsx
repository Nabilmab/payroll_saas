// frontend/src/features/salaryComponents/pages/SalaryComponentsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Heading, Button, useDisclosure, useToast, Spinner, Text, Flex } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import SalaryComponentList from '../components/SalaryComponentList';
import SalaryComponentModal from '../components/SalaryComponentModal';
import { SalaryComponent, SalaryComponentFormData } from '../../../types'; // Path to your types
import {
  fetchSalaryComponents,
  addSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  toggleSalaryComponentActive, // Assuming you added this to your API service
} from '../../../services/salaryComponentApi'; // Path to your API service

const SalaryComponentsPage: React.FC = () => {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | undefined>(undefined);

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const toast = useToast();

  const loadComponents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSalaryComponents();
      setComponents(data);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch salary components.';
      setError(errorMessage);
      toast({
        title: 'Error fetching components',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  const handleOpenAddModal = () => {
    setEditingComponent(undefined); // Ensure no component is being edited
    onModalOpen();
  };

  const handleOpenEditModal = (componentToEdit: SalaryComponent) => {
    setEditingComponent(componentToEdit);
    onModalOpen();
  };

  const handleSaveComponent = async (data: SalaryComponentFormData) => {
    setIsLoading(true); // Consider a more granular loading state for modal operations
    setError(null);
    try {
      let savedComponent;
      if (data.id) { // If id exists, it's an update
        savedComponent = await updateSalaryComponent(data.id, data);
        toast({
          title: 'Component Updated',
          description: `${savedComponent.name} has been updated successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else { // No id, so it's an add
        savedComponent = await addSalaryComponent(data);
        toast({
          title: 'Component Added',
          description: `${savedComponent.name} has been added successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onModalClose(); // Close modal first
      await loadComponents(); // Then reload components to reflect changes
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || (data.id ? 'Failed to update component.' : 'Failed to add component.');
      setError(errorMessage); // Set page-level error if needed, or rely on toast
      toast({
        title: data.id ? 'Update Failed' : 'Add Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const handleToggleActive = async (componentToToggle: SalaryComponent) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the dedicated toggle function from the API service
      const updatedComponent = await toggleSalaryComponentActive(componentToToggle);
      setComponents((prevComponents) =>
        prevComponents.map((c) => (c.id === updatedComponent.id ? updatedComponent : c))
      );
      toast({
        title: 'Status Updated',
        description: `Component ${updatedComponent.name} is now ${updatedComponent.is_active ? 'active' : 'inactive'}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'Failed to update component status.';
      setError(errorMessage);
      toast({
        title: 'Status Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optional: Add a confirmation dialog here
    if (!window.confirm('Are you sure you want to delete this salary component?')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await deleteSalaryComponent(id);
      setComponents((prevComponents) => prevComponents.filter((c) => c.id !== id));
      toast({
        title: 'Component Deleted',
        description: 'The salary component has been deleted successfully.',
        status: 'warning', // Or 'success'
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'Failed to delete salary component.';
      setError(errorMessage);
      toast({
        title: 'Deletion Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Manage Salary Components</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={handleOpenAddModal}
        >
          Add New Component
        </Button>
      </Flex>

      {isLoading && components.length === 0 && ( // Show spinner only on initial load
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {error && ( // Display a general error message if needed, or rely solely on toasts
        <Box color="red.500" mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor="red.300" bg="red.50">
          <Text fontWeight="bold">An error occurred:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      {!isLoading && !error && components.length === 0 && (
         <Text mt="4">No salary components found. Click "Add New Component" to get started!</Text>
      )}

      {components.length > 0 && (
        <SalaryComponentList
          components={components}
          onEdit={handleOpenEditModal} // Pass the correct handler
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          // The list component itself should disable edit/delete for system_defined items
        />
      )}

      <SalaryComponentModal
        isOpen={isModalOpen}
        onClose={() => {
          onModalClose();
          setEditingComponent(undefined); // Clear editing state when modal closes
        }}
        onSave={handleSaveComponent}
        component={editingComponent}
      />
    </Box>
  );
};

export default SalaryComponentsPage;
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast, // For user feedback
  Flex, // For layout
} from '@chakra-ui/react';
import SalaryComponentList from '../components/SalaryComponentList';
import SalaryComponentModal from '../components/SalaryComponentModal';
import { SalaryComponent, SalaryComponentFormData } from '../../../types';
import {
  fetchSalaryComponents,
  addSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  toggleSalaryComponentActive,
} from '../../../services/salaryComponentApi';

const SalaryComponentsPage: React.FC = () => {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const loadComponents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSalaryComponents();
      setComponents(data);
    } catch (err) {
      const apiError = err as { error?: string; message?: string };
      const errorMessage = apiError?.message || apiError?.error || 'Failed to fetch salary components.';
      setError(errorMessage);
      toast({ title: 'Error fetching components', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  const handleModalOpen = (component?: SalaryComponent) => {
    setEditingComponent(component || null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingComponent(null);
  };

  const handleSaveComponent = async (data: SalaryComponentFormData) => {
    setIsLoading(true); // Consider a more specific saving state, e.g., isSubmitting
    try {
      if (editingComponent && editingComponent.id) {
        await updateSalaryComponent(editingComponent.id, data);
        toast({ title: 'Component Updated', description: `${data.name} has been updated.`, status: 'success', duration: 3000, isClosable: true });
      } else {
        await addSalaryComponent(data);
        toast({ title: 'Component Added', description: `${data.name} has been added.`, status: 'success', duration: 3000, isClosable: true });
      }
      await loadComponents(); // Refresh the list
    } catch (err) {
      const apiError = err as { error?: string; message?: string };
      const errorMessage = apiError?.message || apiError?.error || 'Failed to save component.';
      setError(errorMessage); // Set error for display on page if needed, toast is primary feedback
      toast({ title: 'Save Error', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false); // Reset general loading state
      handleModalClose();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this salary component?')) {
      setIsLoading(true); // Indicate loading for delete operation
      try {
        await deleteSalaryComponent(id);
        toast({ title: 'Component Deleted', description: 'Salary component has been deleted.', status: 'success', duration: 3000, isClosable: true });
        await loadComponents(); // Refresh the list
      } catch (err) {
        const apiError = err as { error?: string; message?: string };
        const errorMessage = apiError?.message || apiError?.error || 'Failed to delete component.';
        setError(errorMessage);
        toast({ title: 'Delete Error', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
        setIsLoading(false); // Ensure loading is false on error too
      }
      // setIsLoading(false) will be handled by loadComponents in success case or above in error case
    }
  };

  const handleToggleActive = async (component: SalaryComponent) => {
    setIsLoading(true); // Indicate loading for toggle operation
    try {
      await toggleSalaryComponentActive(component);
      toast({
        title: 'Status Updated',
        description: `${component.name} status has been ${component.is_active ? 'deactivated' : 'activated'}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadComponents(); // Refresh the list
    } catch (err) {
      const apiError = err as { error?: string; message?: string };
      const errorMessage = apiError?.message || apiError?.error || 'Failed to toggle active status.';
      setError(errorMessage);
      toast({ title: 'Toggle Error', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
      setIsLoading(false); // Ensure loading is false on error too
    }
  };

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Heading>Manage Salary Components</Heading>
        <Button colorScheme="blue" onClick={() => handleModalOpen()}>
          Add New Component
        </Button>
      </Flex>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>An Error Occurred!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      {isLoading && components.length === 0 ? ( // Show spinner only if loading and no data yet
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <SalaryComponentList
          components={components}
          onEdit={handleModalOpen}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      {isModalOpen && (
        <SalaryComponentModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleSaveComponent}
          component={editingComponent || undefined} // Pass undefined if editingComponent is null
        />
      )}
    </Box>
  );
};

export default SalaryComponentsPage;

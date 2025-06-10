import React, { useState, useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import SalaryComponentList from '../components/SalaryComponentList'; // Adjust path as needed
import { SalaryComponent } from '../../../types'; // Import the central type
// import { fetchSalaryComponents, addSalaryComponent, updateSalaryComponent, deleteSalaryComponent } from '../api'; // Adjust path to your API functions

// Define a type for salary components -- REMOVED

const SalaryComponentsPage: React.FC = () => {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock API functions (replace with actual API calls)
  const fetchSalaryComponents = async (): Promise<SalaryComponent[]> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          // Sample data - replace with actual fetched data
          { id: '1', name: 'Basic Salary', type: 'earning', calculation_type: 'fixed', default_amount: 50000, is_taxable: true, is_system_defined: false, is_active: true },
          { id: '2', name: 'House Rent Allowance', type: 'earning', calculation_type: 'percentage', default_amount: 40, is_taxable: true, is_system_defined: false, is_active: true },
          { id: '3', name: 'Provident Fund', type: 'deduction', calculation_type: 'fixed', default_amount: 1800, is_taxable: false, is_system_defined: true, is_active: true },
        ]);
      }, 1000);
    });
  };

  const addSalaryComponent = async (component: Omit<SalaryComponent, 'id' | 'is_system_defined' | 'is_active'>): Promise<SalaryComponent> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newComponent: SalaryComponent = {
          ...component,
          id: String(Date.now()), // Create a new ID
          is_system_defined: false,
          is_active: true
        };
        resolve(newComponent);
      }, 500);
    });
  };

  const updateSalaryComponent = async (component: SalaryComponent): Promise<SalaryComponent> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(component); // Return the updated component
      }, 500);
    });
  };

  const deleteSalaryComponent = async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(); // Indicate successful deletion
      }, 500);
    });
  };
  // End of Mock API functions

  useEffect(() => {
    const loadComponents = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSalaryComponents();
        setComponents(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch salary components.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadComponents();
  }, []);

  const handleAdd = async (newComponentData: Omit<SalaryComponent, 'id' | 'is_system_defined' | 'is_active'>) => {
    setIsLoading(true);
    try {
      const addedComponent = await addSalaryComponent(newComponentData);
      setComponents([...components, addedComponent]);
      setError(null);
    } catch (err) {
      setError('Failed to add salary component.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (updatedComponent: SalaryComponent) => {
    setIsLoading(true);
    try {
      const returnedComponent = await updateSalaryComponent(updatedComponent);
      setComponents(
        components.map((c) => (c.id === returnedComponent.id ? returnedComponent : c))
      );
      setError(null);
    } catch (err) {
      setError('Failed to update salary component.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (componentToToggle: SalaryComponent) => {
    setIsLoading(true);
    try {
      const updatedComponent = { ...componentToToggle, is_active: !componentToToggle.is_active };
      const returnedComponent = await updateSalaryComponent(updatedComponent);
      setComponents(
        components.map((c) => (c.id === returnedComponent.id ? returnedComponent : c))
      );
      setError(null);
    } catch (err) {
      setError('Failed to update salary component status.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteSalaryComponent(id);
      setComponents(components.filter((c) => c.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete salary component.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Box>Loading...</Box>; // Or a spinner component
  }

  if (error) {
    return <Box color="red.500">{error}</Box>; // Display error message
  }

  return (
    <Box p={5}>
      <Heading mb={5}>Manage Salary Components</Heading>
      <SalaryComponentList
        components={components}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive} // Add this line
      />
    </Box>
  );
};

export default SalaryComponentsPage;

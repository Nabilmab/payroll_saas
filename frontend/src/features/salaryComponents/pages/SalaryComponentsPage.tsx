import React, { useState, useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import SalaryComponentList from '../components/SalaryComponentList'; // Adjust path as needed
// import { fetchSalaryComponents, addSalaryComponent, updateSalaryComponent, deleteSalaryComponent } from '../api'; // Adjust path to your API functions

// Define a type for salary components
interface SalaryComponent {
  id: string; // Or number
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage';
  value: number;
  isTaxable: boolean;
  isCalculatedInCtc: boolean;
  // Add other relevant fields
}

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
          { id: '1', name: 'Basic Salary', type: 'earning', calculationType: 'fixed', value: 50000, isTaxable: true, isCalculatedInCtc: true },
          { id: '2', name: 'House Rent Allowance', type: 'earning', calculationType: 'percentage', value: 40, isTaxable: true, isCalculatedInCtc: true },
          { id: '3', name: 'Provident Fund', type: 'deduction', calculationType: 'fixed', value: 1800, isTaxable: false, isCalculatedInCtc: true },
        ]);
      }, 1000);
    });
  };

  const addSalaryComponent = async (component: Omit<SalaryComponent, 'id'>): Promise<SalaryComponent> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newComponent = { ...component, id: String(Date.now()) }; // Create a new ID
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

  const handleAdd = async (newComponentData: Omit<SalaryComponent, 'id'>) => {
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
        onAddNew={handleAdd} // Pass the add handler
      />
    </Box>
  );
};

export default SalaryComponentsPage;

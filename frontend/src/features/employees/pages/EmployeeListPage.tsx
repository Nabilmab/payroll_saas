// --- START OF UPDATED FILE ---
// ---
// frontend/src/features/employees/pages/EmployeeListPage.tsx
// ---
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td, Link as ChakraLink,
  Flex, Button, useDisclosure, useToast, IconButton
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { fetchEmployees, addEmployee, updateEmployee, deleteEmployee } from '../../../services/employeeApi';
import { Employee } from '../../../types';
import EmployeeModal, { EmployeeFormData } from '../components/EmployeeModal';

const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      setEmployees(await fetchEmployees());
    } catch (err: any) {
      setError(err.message || "Failed to fetch employees.");
      toast({ title: 'Error', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleOpenAddModal = () => {
    setEditingEmployee(undefined);
    onOpen();
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    onOpen();
  };

  const handleSaveEmployee = async (data: EmployeeFormData) => {
    try {
      if (data.id) {
        await updateEmployee(data.id, data);
        toast({ title: 'Employee Updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        await addEmployee(data);
        toast({ title: 'Employee Added', status: 'success', duration: 3000, isClosable: true });
      }
      onClose();
      loadEmployees();
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      await deleteEmployee(id);
      toast({ title: 'Employee Deleted', status: 'warning', duration: 3000, isClosable: true });
      loadEmployees();
    } catch (err: any) {
      toast({
        title: 'Deletion Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading && employees.length === 0) return <Flex justify="center" py={10}><Spinner size="xl" /></Flex>;
  if (error && employees.length === 0) return <Text color="red.500">Error: {error}</Text>;

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Employees</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={handleOpenAddModal}>
          Add Employee
        </Button>
      </Flex>
      <Table variant="simple" bg="white" borderRadius="md" boxShadow="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Job Title</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {employees.map((e) => (
            <Tr key={e.id} _hover={{ bg: 'gray.50' }}>
              <Td>
                <ChakraLink as={RouterLink} to={`/employees/${e.id}`} color="teal.500" fontWeight="medium">
                  {e.firstName} {e.lastName}
                </ChakraLink>
              </Td>
              <Td>{e.jobTitle}</Td>
              <Td textTransform="capitalize">{e.status.replace('_', ' ')}</Td>
              <Td>
                <IconButton icon={<EditIcon />} aria-label="Edit Employee" size="sm" variant="ghost" onClick={() => handleOpenEditModal(e)} />
                <IconButton icon={<DeleteIcon />} aria-label="Delete Employee" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteEmployee(e.id)} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <EmployeeModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />
    </Box>
  );
};

export default EmployeeListPage;
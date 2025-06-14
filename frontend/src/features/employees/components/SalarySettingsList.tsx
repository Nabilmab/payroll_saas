// --- START OF UPDATED FILE ---
// ---
// frontend/src/features/employees/components/SalarySettingsList.tsx
// ---
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner,
  Text, useToast, Flex, IconButton, Badge, useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { EmployeeSalarySetting, SalarySettingFormData } from '../../../types';
import { fetchEmployeeSalarySettings, deleteEmployeeSalarySetting, addEmployeeSalarySetting, updateEmployeeSalarySetting } from '../../../services/employeeSalarySettingApi';
import formatFinancialValue from '../../../utils/formatAmount';
import SalarySettingModal from './SalarySettingModal';

interface SalarySettingsListProps {
  employeeId: string;
}

const SalarySettingsList: React.FC<SalarySettingsListProps> = ({ employeeId }) => {
  const [settings, setSettings] = useState<EmployeeSalarySetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<EmployeeSalarySetting | undefined>(undefined);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEmployeeSalarySettings(employeeId);
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load salary settings.');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      loadSettings();
    }
  }, [loadSettings, employeeId]);

  // ... (handleOpenAddModal, handleOpenEditModal, handleSave, handleDelete are the same) ...
  const handleOpenAddModal = () => {
    setEditingSetting(undefined);
    onOpen();
  };

  const handleOpenEditModal = (setting: EmployeeSalarySetting) => {
    setEditingSetting(setting);
    onOpen();
  };

  const handleSave = async (data: SalarySettingFormData) => {
    try {
      if (data.id) {
        await updateEmployeeSalarySetting(employeeId, data.id, data);
        toast({ title: 'Setting Updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        await addEmployeeSalarySetting(employeeId, data);
        toast({ title: 'Setting Added', status: 'success', duration: 3000, isClosable: true });
      }
      onClose();
      loadSettings();
    } catch (err: any) {
      toast({
        title: data.id ? 'Update Failed' : 'Add Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (settingId: string) => {
    if (!window.confirm('Are you sure you want to remove this salary setting?')) {
      return;
    }
    try {
      await deleteEmployeeSalarySetting(employeeId, settingId);
      toast({
        title: 'Setting Removed',
        description: 'The salary setting has been successfully removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadSettings();
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

  if (isLoading && settings.length === 0) {
    return <Flex justify="center" align="center" h="100px"><Spinner /></Flex>;
  }

  if (error) {
    return <Text color="red.500">Error: {error}</Text>;
  }

  return (
    <Box>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Assigned Salary Components</Heading>
            <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={handleOpenAddModal}>
                Add Setting
            </Button>
        </Flex>
        <TableContainer bg="white" boxShadow="sm" borderRadius="lg">
            <Table variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>Component Name</Th>
                        <Th>Type</Th>
                        <Th>Value</Th>
                        <Th>Effective Date</Th>
                        <Th>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {!isLoading && settings.length === 0 && (
                        <Tr>
                            <Td colSpan={5} textAlign="center" p={6}>
                                No salary settings assigned to this employee yet.
                            </Td>
                        </Tr>
                    )}
                    {settings.map((setting) => {
                      if (!setting.salaryComponent) {
                          return null;
                      }
                      return (
                        <Tr key={setting.id} _hover={{ bg: 'gray.50' }}>
                            <Td>
                                <Text fontWeight="medium">{setting.salaryComponent.name}</Text>
                                {setting.salaryComponent.description && <Text fontSize="sm" color="gray.500">{setting.salaryComponent.description}</Text>}
                            </Td>
                            <Td>
                                <Badge variant="subtle" colorScheme={setting.salaryComponent.type === 'earning' ? 'green' : 'red'}>
                                    {setting.salaryComponent.type.charAt(0).toUpperCase() + setting.salaryComponent.type.slice(1)}
                                </Badge>
                            </Td>
                            <Td fontWeight="medium">
                                {setting.salaryComponent.calculation_type === 'formula'
                                  ? 'Formula'
                                  : formatFinancialValue(
                                    setting.amount ?? setting.percentage,
                                    setting.salaryComponent.calculation_type,
                                  )
                                }
                            </Td>
                            {/* FIX: Use the correct camelCase property */}
                            <Td>{new Date(setting.effectiveDate).toLocaleDateString()}</Td>
                            <Td>
                                <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" variant="ghost" mr={2} onClick={() => handleOpenEditModal(setting)}/>
                                <IconButton
                                  aria-label="Delete"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDelete(setting.id)}
                                />
                            </Td>
                        </Tr>
                      )}
                    )}
                </Tbody>
            </Table>
        </TableContainer>

        <SalarySettingModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSave}
            employeeId={employeeId}
            settingToEdit={editingSetting}
        />
    </Box>
  );
};

export default SalarySettingsList;
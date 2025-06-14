// --- START OF NEW FILE ---
// ---
// frontend/src/features/employees/components/EmployeeModal.tsx
// ---
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Select, VStack, useToast, HStack
} from '@chakra-ui/react';
import { Department, Employee } from '../../../types';
import { fetchDepartments } from '../../../services/departmentApi';

// A more specific type for the form data to avoid full Employee type complexity
export interface EmployeeFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  hireDate: string;
  departmentId?: string;
  status: 'active' | 'on_leave' | 'terminated' | 'pending_hire';
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => Promise<void>; // Make onSave async
  employee?: Employee;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    hireDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    status: 'active',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Fetch departments to populate the dropdown
    const loadDepartments = async () => {
      try {
        const fetchedDepartments = await fetchDepartments();
        setDepartments(fetchedDepartments);
      } catch (error) {
        toast({
          title: 'Failed to load departments',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (isOpen) {
      loadDepartments();
      if (employee) {
        setFormData({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          jobTitle: employee.jobTitle,
          hireDate: new Date(employee.hireDate).toISOString().split('T')[0],
          departmentId: employee.departmentId || '',
          status: employee.status,
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          jobTitle: '',
          hireDate: new Date().toISOString().split('T')[0],
          departmentId: '',
          status: 'active',
        });
      }
    }
  }, [employee, isOpen, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.jobTitle || !formData.hireDate || !formData.departmentId) {
        toast({ title: 'Please fill all required fields.', status: 'warning', duration: 3000, isClosable: true });
        return;
    }
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };
  
  const isSaveDisabled = !formData.firstName || !formData.lastName || !formData.email || !formData.jobTitle || !formData.hireDate || !formData.departmentId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{employee ? 'Edit Employee' : 'Add New Employee'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <HStack w="full" spacing={4}>
                <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input name="firstName" value={formData.firstName} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input name="lastName" value={formData.lastName} onChange={handleChange} />
                </FormControl>
            </HStack>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Job Title</FormLabel>
              <Input name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
            </FormControl>
             <FormControl isRequired>
              <FormLabel>Department</FormLabel>
              <Select name="departmentId" value={formData.departmentId} onChange={handleChange} placeholder="Select department">
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Hire Date</FormLabel>
              <Input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" onClick={handleSave} isDisabled={isSaveDisabled} isLoading={isSaving}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmployeeModal;
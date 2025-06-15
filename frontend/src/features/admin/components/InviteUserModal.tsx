// frontend/src/features/admin/components/InviteUserModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Select, VStack, useToast,
} from '@chakra-ui/react';
import { fetchTenantRoles } from '../../../services/tenantAdminApi';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSuccess: () => void; // Callback to refresh the user list
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onInviteSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({ firstName: '', lastName: '', email: '', roleId: '' });
      // Fetch available roles for the dropdown
      const loadRoles = async () => {
        try {
          const fetchedRoles = await fetchTenantRoles();
          setRoles(fetchedRoles);
          if (fetchedRoles.length > 0) {
            setFormData(prev => ({ ...prev, roleId: fetchedRoles[0].id }));
          }
        } catch (error) {
          toast({ title: 'Failed to load roles', status: 'error' });
        }
      };
      loadRoles();
    }
  }, [isOpen, toast]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { inviteUser } = await import('../../../services/tenantAdminApi');
    setIsLoading(true);
    try {
      await inviteUser(formData);
      toast({ title: 'Invitation Sent!', status: 'success' });
      onInviteSuccess(); // Refresh the list on the parent page
      onClose();
    } catch (err: any) {
      toast({ title: 'Invitation Failed', description: err.message, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormInvalid = !formData.email || !formData.firstName || !formData.lastName || !formData.roleId;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invite New User</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>First Name</FormLabel>
              <Input name="firstName" value={formData.firstName} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Last Name</FormLabel>
              <Input name="lastName" value={formData.lastName} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Select name="roleId" value={formData.roleId} onChange={handleChange}>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" onClick={handleSubmit} isLoading={isLoading} isDisabled={isFormInvalid} ml={3}>
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
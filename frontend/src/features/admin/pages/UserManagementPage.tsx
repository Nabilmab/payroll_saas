// frontend/src/features/admin/pages/UserManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Heading, Flex, useToast, Spinner, Table, Thead, Tbody, Tr, Th, Td, Badge,
    Button, useDisclosure, Select, IconButton
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { fetchTenantUsers, fetchTenantRoles, updateUserRole, removeUserAccess } from '../../../services/tenantAdminApi';
import { InviteUserModal } from '../components/InviteUserModal';
import { useUser } from '../../../context/UserContext';

// Define a more specific type for the user data we receive
interface TenantUser {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    role: {
        id: string;
        name: string;
    };
}

interface Role {
    id: string;
    name: string;
}

const UserManagementPage: React.FC = () => {
    const { user: adminUser } = useUser();
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();
    const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [userData, roleData] = await Promise.all([
                fetchTenantUsers(),
                fetchTenantRoles()
            ]);
            setUsers(userData);
            setRoles(roleData);
        } catch (err: any) {
            toast({ title: 'Error loading data', description: err.message, status: 'error', isClosable: true });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRoleChange = async (userId: string, newRoleId: string) => {
        try {
            await updateUserRole(userId, newRoleId);
            toast({ title: "Role Updated", status: 'success', duration: 2000, isClosable: true });
            await loadData(); // Refresh data to reflect change
        } catch (err: any) {
            toast({ title: "Update Failed", description: err?.response?.data?.msg || err.message, status: 'error', isClosable: true });
            await loadData(); // Refresh data to revert dropdown on failure
        }
    };

    const handleRemoveUser = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to remove ${userName} from this company? This action cannot be undone.`)) {
            return;
        }
        try {
            await removeUserAccess(userId);
            toast({ title: "User Removed", description: `${userName} has been removed.`, status: 'success', duration: 3000, isClosable: true });
            await loadData();
        } catch (err: any) {
            toast({ title: "Removal Failed", description: err?.response?.data?.msg || err.message, status: 'error', isClosable: true });
        }
    };

    return (
        <Box>
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading size="lg">User Management</Heading>
                <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={onInviteOpen}>
                    Invite User
                </Button>
            </Flex>

            {isLoading ? <Flex justify="center" py={10}><Spinner size="xl" /></Flex> : (
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Role</Th>
                            <Th isNumeric>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {users.map((u) => (
                            <Tr key={u.user.id}>
                                <Td>{u.user.firstName} {u.user.lastName}</Td>
                                <Td>{u.user.email}</Td>
                                <Td>
                                    <Select
                                        size="sm"
                                        value={u.role.id}
                                        onChange={(e) => handleRoleChange(u.user.id, e.target.value)}
                                        isDisabled={u.user.id === adminUser?.id}
                                        maxW="150px"
                                    >
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </Select>
                                </Td>
                                <Td isNumeric>
                                    <IconButton
                                        aria-label="Remove user"
                                        icon={<DeleteIcon />}
                                        colorScheme="red"
                                        variant="ghost"
                                        isDisabled={u.user.id === adminUser?.id}
                                        onClick={() => handleRemoveUser(u.user.id, `${u.user.firstName} ${u.user.lastName}`)}
                                    />
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}

            <InviteUserModal
                isOpen={isInviteOpen}
                onClose={onInviteClose}
                onInviteSuccess={loadData}
            />
        </Box>
    );
};

export default UserManagementPage;
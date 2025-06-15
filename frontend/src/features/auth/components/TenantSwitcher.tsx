// src/features/auth/components/TenantSwitcher.tsx

import React, { useEffect, useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useToast,
  Text,
  Spinner, // Import Spinner for the loading state
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useUser } from '../../../context/UserContext';
import { selectTenant } from '../../../services/authApi';
import { Tenant } from '../../../types';

const TenantSwitcher: React.FC = () => {
  const { user, setUser } = useUser();
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>(() => {
    const stored = localStorage.getItem('available_tenants');
    return stored ? JSON.parse(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (availableTenants.length === 0) {
      const storedTenants = localStorage.getItem('available_tenants');
      if (storedTenants) {
        setAvailableTenants(JSON.parse(storedTenants));
      }
    }
  }, [availableTenants.length]);

  const handleSwitchTenant = async (tenantId: string) => {
    if (!user || user.tenant.id === tenantId) return;

    setIsLoading(true);
    try {
      const { token, user: userWithContext } = await selectTenant(user.id, tenantId);

      localStorage.setItem('token', token);
      localStorage.setItem('userProfile', JSON.stringify(userWithContext));
      
      setUser(userWithContext);
      window.location.href = '/';

    } catch (error: any) {
      toast({
        title: 'Failed to switch company.',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };
  
  if (availableTenants.length <= 1) {
    return null;
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="outline"
        size="sm"
        colorScheme="gray"
        ml={4}
        isLoading={isLoading}
      >
        Switch
      </MenuButton>
      <MenuList>
        {availableTenants.map((tenant) => (
          <MenuItem
            key={tenant.id}
            onClick={() => handleSwitchTenant(tenant.id)}
            isDisabled={user?.tenant.id === tenant.id || isLoading}
          >
            <Text fontWeight={user?.tenant.id === tenant.id ? 'bold' : 'normal'}>
                {tenant.name}
            </Text>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default TenantSwitcher;
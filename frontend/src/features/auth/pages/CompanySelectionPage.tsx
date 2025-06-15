// src/features/auth/pages/CompanySelectionPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  Flex,
  Spinner,
  SimpleGrid,
  Tag,
} from '@chakra-ui/react';
import { selectTenant } from '../../../services/authApi';
import { Tenant } from '../../../types';
import { useUser } from '../../../context/UserContext';

const CompanySelectionPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { setUser } = useUser();

  useEffect(() => {
    const storedTenants = localStorage.getItem('available_tenants');
    const storedUserId = localStorage.getItem('pending_user_id');

    if (storedTenants && storedUserId) {
      setTenants(JSON.parse(storedTenants));
      setUserId(storedUserId);
    } else {
      // If data is missing, the user probably landed here by mistake. Redirect to login.
      toast({
        title: 'Session error',
        description: 'No selection data found. Please log in again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    }
  }, [navigate, toast]);

  const handleSelectTenant = async (tenantId: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { token, user: userWithContext } = await selectTenant(userId, tenantId);

      // Store the final session data
      localStorage.setItem('token', token);
      localStorage.setItem('userProfile', JSON.stringify(userWithContext));

      // Clean up ONLY the temporary user ID. Keep the tenants list!
      localStorage.removeItem('pending_user_id');
      
      setUser(userWithContext);
      
      navigate('/');

    } catch (error: any) {
      toast({
        title: 'Failed to select company.',
        description: error.message || 'An unknown error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  if (!tenants.length) {
    return (
      <Flex align="center" justify="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    )
  }

  return (
    <Flex align="center" justify="center" h="100vh" bg="gray.50">
      <Box p={8} maxWidth="800px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white" w="full">
        <VStack spacing={6}>
          <Heading>Select a Company</Heading>
          <Text>You have access to multiple companies. Please choose one to continue.</Text>
          {isLoading ? (
            <Spinner size="xl" />
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              {tenants.map((tenant) => (
                <Button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant.id)}
                  height="auto"
                  p={4}
                  display="flex"
                  flexDirection="column"
                  alignItems="start"
                  justifyContent="space-between"
                  variant="outline"
                >
                  <VStack align="start" w="full">
                    <Text fontWeight="bold" fontSize="lg">{tenant.name}</Text>
                    <Tag colorScheme="cyan">{tenant.jurisdiction.name}</Tag>
                  </VStack>
                </Button>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default CompanySelectionPage;
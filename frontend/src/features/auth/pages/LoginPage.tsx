// src/features/auth/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  Flex,
} from '@chakra-ui/react';
import { loginUser, selectTenant } from '../../../services/authApi'; // Import both services
import { useUser } from '../../../context/UserContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin.ma@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { setUser } = useUser();
  const navigate = useNavigate(); // For redirecting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      // --- NEW STAGE 1: LOGIN ---
      const loginResponse = await loginUser({ email, password });
      const { user, tenants } = loginResponse;

      // --- NEW LOGIC: CHECK TENANT COUNT ---
      if (tenants.length === 0) {
        // This case should be handled by the backend, but good to have a safeguard
        setError("This account is not associated with any company.");
        return;
      }

      if (tenants.length === 1) {
        // --- AUTO-SELECT IF ONLY ONE TENANT ---
        toast({
          title: 'Login Successful',
          description: `Welcome! Setting active company to ${tenants[0].name}.`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // --- STAGE 2: SELECT TENANT ---
        const { token, user: userWithContext } = await selectTenant(user.id, tenants[0].id);
        
        // Store session token and full user profile
        localStorage.setItem('token', token);
        localStorage.setItem('userProfile', JSON.stringify(userWithContext));
        // ADD THIS LINE: Store the list of tenants for the switcher
        localStorage.setItem('available_tenants', JSON.stringify(tenants));
        
        setUser(userWithContext); // Update context
      } else {
        // --- MULTIPLE TENANTS: REDIRECT TO SELECTION PAGE ---
        toast({
          title: 'Login Successful',
          description: 'Please select a company to continue.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        // Store the intermediate data needed for the selection page
        localStorage.setItem('pending_user_id', user.id);
        localStorage.setItem('available_tenants', JSON.stringify(tenants));

        navigate('/select-company'); // Redirect to the new page
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align="center" justify="center" h="100vh" bg="gray.50">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white" w="full">
        <VStack spacing={4}>
          <Heading>Login to Payroll SaaS</Heading>
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="teal"
                width="full"
                isLoading={isLoading}
              >
                Log In
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Flex>
  );
};

export default LoginPage;
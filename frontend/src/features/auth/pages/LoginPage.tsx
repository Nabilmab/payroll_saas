// frontend/src/features/auth/pages/LoginPage.tsx
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
  Flex, // FIX: Add Flex to the import list
} from '@chakra-ui/react';
import { loginUser } from '../../../services/authApi';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use one of the users from your seed data.
      // e.g., email: 'manager.rh@techsolutions.ma', password: 'password123'
      const { token } = await loginUser({ email, password });
      
      localStorage.setItem('token', token);

      toast({
        title: 'Login Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/'); 

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align="center" justify="center" h="100vh">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" w="full">
        <VStack spacing={4}>
          <Heading>Login</Heading>
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
// --- START OF UPDATED FILE ---
// ---
// frontend/src/features/employees/pages/EmployeeDetailPage.tsx
// ---
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Heading, Spinner, Text, VStack, HStack, Tag, Divider, Flex, Card, CardHeader, CardBody } from '@chakra-ui/react';
import { fetchEmployeeById } from '../../../services/employeeApi';
import { Employee } from '../../../types';
import SalarySettingsList from '../components/SalarySettingsList';

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setIsLoading(false); setError("Employee ID is missing."); return; }
    const getDetails = async () => {
      setIsLoading(true); setError(null);
      try { setEmployee(await fetchEmployeeById(id)); }
      catch (err: any) { setError(err.message || 'Failed to fetch details.'); }
      finally { setIsLoading(false); }
    };
    getDetails();
  }, [id]);

  if (isLoading) return <Flex justify="center" align="center" h="50vh"><Spinner size="xl" /></Flex>;
  if (error) return <Text color="red.500">Error: {error}</Text>;
  if (!employee) return <Text>Employee not found.</Text>;

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          {/* FIX: Use camelCase properties */}
          <Heading as="h1" size="xl">{employee.firstName} {employee.lastName}</Heading>
          <Text fontSize="xl" color="gray.600">{employee.jobTitle}</Text>
        </Box>
        <Card variant="outline">
          <CardHeader><Heading size="md">Employee Information</Heading></CardHeader>
          <CardBody>
            <VStack spacing={4} align="flex-start">
              <HStack w="full"><Text w="150px" fontWeight="bold">Email:</Text><Text>{employee.email}</Text></HStack><Divider />
              <HStack w="full"><Text w="150px" fontWeight="bold">Department:</Text><Text>{employee.department?.name || 'N/A'}</Text></HStack><Divider />
              <HStack w="full"><Text w="150px" fontWeight="bold">Status:</Text><Tag colorScheme={employee.status === 'active' ? 'green' : 'red'}>{employee.status.replace('_', ' ')}</Tag></HStack><Divider />
              {/* FIX: Use camelCase property */}
              <HStack w="full"><Text w="150px" fontWeight="bold">Hire Date:</Text><Text>{new Date(employee.hireDate).toLocaleDateString()}</Text></HStack>
            </VStack>
          </CardBody>
        </Card>
        <Card variant="outline">
           <CardBody>
             <SalarySettingsList employeeId={employee.id} />
           </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};
export default EmployeeDetailPage;
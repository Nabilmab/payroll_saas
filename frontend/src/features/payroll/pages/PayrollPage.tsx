// --- START OF UPDATED FILE ---
// ---
// frontend/src/features/payroll/pages/PayrollPage.tsx
// ---
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Flex,
  useToast,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { PayrollRun } from '../../../types';
import { fetchPayrollRuns, startPayrollRun, StartPayrollRunPayload } from '../../../services/payrollRunApi';
import formatFinancialValue from '../../../utils/formatAmount';
import StartRunModal from '../components/StartRunModal'; // <-- Import the modal

const PayrollPage: React.FC = () => {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadPayrollRuns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPayrollRuns();
      setRuns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payroll runs.');
      toast({
        title: 'Error Loading History',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPayrollRuns();
  }, [loadPayrollRuns]);

  const handleStartRun = async (payload: StartPayrollRunPayload) => {
    setIsStartingRun(true);
    try {
        await startPayrollRun(payload);
        toast({
            title: 'Payroll Run Started',
            description: 'The payroll is being processed. This may take a moment.',
            status: 'success',
            duration: 5000,
            isClosable: true,
        });
        onClose();
        loadPayrollRuns(); // Refresh the list to show the new run
    } catch (err: any) {
        toast({
            title: 'Payroll Run Failed',
            description: err.message,
            status: 'error',
            duration: 9000,
            isClosable: true,
        });
    } finally {
        setIsStartingRun(false);
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Payroll Runs</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={onOpen}>
          Start New Payroll Run
        </Button>
      </Flex>

      {isLoading && runs.length === 0 && (
        <Flex justifyContent="center" py={10}><Spinner size="xl" /></Flex>
      )}

      {error && (
        <Text color="red.500">Could not load payroll history: {error}</Text>
      )}
      
      {!isLoading && !error && runs.length === 0 && (
          <Text mt={4}>No payroll runs found. Click "Start New Payroll Run" to begin.</Text>
      )}

      {runs.length > 0 && (
        <TableContainer bg="white" boxShadow="sm" borderRadius="lg">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Pay Period</Th>
                <Th>Payment Date</Th>
                <Th>Status</Th>
                <Th isNumeric>Net Pay</Th>
                <Th isNumeric>Employees</Th>
              </Tr>
            </Thead>
            <Tbody>
              {runs.map((run) => (
                <Tr key={run.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }}>
                  <Td fontWeight="medium">
                    {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                  </Td>
                  <Td>{new Date(run.paymentDate).toLocaleDateString()}</Td>
                  <Td>
                    <Badge colorScheme={run.status === 'completed' ? 'green' : 'yellow'}>{run.status}</Badge>
                  </Td>
                  <Td isNumeric fontWeight="medium">
                    {formatFinancialValue(parseFloat(run.totalNetPay || '0'), 'fixed', 'MAD')}
                  </Td>
                  <Td isNumeric>{run.totalEmployees}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <StartRunModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleStartRun}
        isStarting={isStartingRun}
      />
    </Box>
  );
};

export default PayrollPage;
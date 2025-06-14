// --- START OF FINAL FILE ---
// ---
// frontend/src/features/payroll/pages/PayrollRunDetailPage.tsx
// ---
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  useToast,
  Link as ChakraLink,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Payslip } from '../../../types';
import { fetchPayslipsForRun } from '../../../services/payslipApi';
import formatFinancialValue from '../../../utils/formatAmount';

const PayrollRunDetailPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadPayslips = useCallback(async () => {
    if (!runId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPayslipsForRun(runId);
      setPayslips(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payslips.');
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [runId, toast]);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const handlePayslipClick = (payslipId: string) => {
    navigate(`/payslips/${payslipId}`);
  };

  if (isLoading) {
    return <Flex justify="center" py={10}><Spinner size="xl" /></Flex>;
  }

  if (error) {
    return <Text color="red.500">Error: {error}</Text>;
  }
  
  // Use the data from the first payslip to display the pay period in the breadcrumb
  const payPeriod = payslips.length > 0 ? new Date(payslips[0].payrollRun.periodStart).toLocaleDateString() + ' - ' + new Date(payslips[0].payrollRun.periodEnd).toLocaleDateString() : 'N/A';

  return (
    <Box>
      <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />} mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/payroll')}>Payroll Runs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">{payPeriod}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading size="lg" mb={6}>Payslips for Payroll Run</Heading>
      
      <TableContainer bg="white" boxShadow="sm" borderRadius="lg">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Employee</Th>
              <Th>Job Title</Th>
              <Th isNumeric>Gross Pay</Th>
              <Th isNumeric>Deductions</Th>
              <Th isNumeric>Taxes</Th>
              <Th isNumeric>Net Pay</Th>
            </Tr>
          </Thead>
          <Tbody>
            {payslips.map((payslip) => (
              <Tr key={payslip.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={() => handlePayslipClick(payslip.id)}>
                <Td>
                    <ChakraLink color="teal.500" fontWeight="medium">
                        {payslip.employee?.firstName} {payslip.employee?.lastName}
                    </ChakraLink>
                </Td>
                <Td>{payslip.employee?.jobTitle}</Td>
                <Td isNumeric>{formatFinancialValue(parseFloat(payslip.grossPay), 'fixed', 'MAD')}</Td>
                <Td isNumeric>{formatFinancialValue(parseFloat(payslip.deductions), 'fixed', 'MAD')}</Td>
                <Td isNumeric>{formatFinancialValue(parseFloat(payslip.taxes), 'fixed', 'MAD')}</Td>
                <Td isNumeric fontWeight="bold">{formatFinancialValue(parseFloat(payslip.netPay), 'fixed', 'MAD')}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PayrollRunDetailPage;
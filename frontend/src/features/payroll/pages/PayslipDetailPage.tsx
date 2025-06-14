// --- START OF NEW FILE: frontend/src/features/payroll/pages/PayslipDetailPage.tsx ---
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Flex,
  useToast,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
} from '@chakra-ui/react';
import { ChevronRightIcon, DownloadIcon } from '@chakra-ui/icons';
import { Payslip } from '../../../types';
import { fetchPayslipById } from '../../../services/payslipApi';
import formatFinancialValue from '../../../utils/formatAmount';

const PayslipDetailPage: React.FC = () => {
  const { payslipId } = useParams<{ payslipId: string }>();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const loadPayslip = useCallback(async () => {
    if (!payslipId) return;
    setIsLoading(true);
    try {
      const data = await fetchPayslipById(payslipId);
      setPayslip(data);
    } catch (err: any) {
      toast({
        title: 'Error loading payslip',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [payslipId, toast]);

  useEffect(() => {
    loadPayslip();
  }, [loadPayslip]);

  if (isLoading) {
    return <Flex justify="center" py={20}><Spinner size="xl" /></Flex>;
  }

  if (!payslip) {
    return <Text>Payslip not found.</Text>;
  }
  
  const earnings = payslip.payslipItems.filter(item => item.type === 'earning');
  const deductions = payslip.payslipItems.filter(item => item.type === 'deduction' || item.type === 'tax');

  return (
    <Box>
      <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />} mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/payroll')}>Payroll Runs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate(`/payroll/runs/${payslip.payrollRun.id}`)}>
            {new Date(payslip.payrollRun.periodStart).toLocaleDateString()} - {new Date(payslip.payrollRun.periodEnd).toLocaleDateString()}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Payslip</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Payslip Details</Heading>
        <Button leftIcon={<DownloadIcon />} colorScheme="blue" variant="outline" isDisabled>
            Download PDF
        </Button>
      </Flex>
      
      <Card variant="outline" mb={6}>
        <CardHeader>
            <Heading size="md">{payslip.employee?.firstName} {payslip.employee?.lastName}</Heading>
            <Text color="gray.600">{payslip.employee?.jobTitle}</Text>
            <Text color="gray.500" fontSize="sm">{payslip.employee?.department?.name}</Text>
        </CardHeader>
        <CardBody>
             <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                <Box>
                    <Text fontSize="sm" color="gray.500">Pay Period</Text>
                    <Text fontWeight="medium">{new Date(payslip.payrollRun.periodStart).toLocaleDateString()} - {new Date(payslip.payrollRun.periodEnd).toLocaleDateString()}</Text>
                </Box>
                 <Box>
                    <Text fontSize="sm" color="gray.500">Payment Date</Text>
                    <Text fontWeight="medium">{new Date(payslip.payrollRun.paymentDate).toLocaleDateString()}</Text>
                </Box>
                 <Box>
                    <Text fontSize="sm" color="gray.500">Net Pay</Text>
                    <Text fontWeight="bold" fontSize="xl" color="green.600">{formatFinancialValue(parseFloat(payslip.netPay), 'fixed', 'MAD')}</Text>
                </Box>
            </SimpleGrid>
        </CardBody>
      </Card>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <VStack spacing={4} align="stretch">
          <Heading size="md">Earnings</Heading>
          {earnings.map(item => (
            <HStack key={item.id} justify="space-between" w="full">
              <Text>{item.description}</Text>
              <Text fontWeight="medium">{formatFinancialValue(parseFloat(item.amount), 'fixed', 'MAD')}</Text>
            </HStack>
          ))}
          <Divider />
          <HStack justify="space-between" w="full" fontWeight="bold">
            <Text>Gross Pay</Text>
            <Text>{formatFinancialValue(parseFloat(payslip.grossPay), 'fixed', 'MAD')}</Text>
          </HStack>
        </VStack>
        
        <VStack spacing={4} align="stretch">
          <Heading size="md">Deductions</Heading>
          {deductions.map(item => (
            <HStack key={item.id} justify="space-between" w="full">
              <Text>{item.description}</Text>
              <Text fontWeight="medium">({formatFinancialValue(parseFloat(item.amount), 'fixed', 'MAD')})</Text>
            </HStack>
          ))}
          <Divider />
          <HStack justify="space-between" w="full" fontWeight="bold">
            <Text>Total Deductions</Text>
            <Text>({formatFinancialValue(parseFloat(payslip.deductions) + parseFloat(payslip.taxes), 'fixed', 'MAD')})</Text>
          </HStack>
        </VStack>
      </SimpleGrid>
    </Box>
  );
};

export default PayslipDetailPage;
// src/app/App.tsx

import React from 'react';
// Import HStack for easy layout
import { Box, Heading, VStack, Text, Button, Tag, Spacer, Flex, Spinner, HStack } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';
import { UserProvider, useUser } from '../context/UserContext';
import TenantSwitcher from '../features/auth/components/TenantSwitcher';

// Page Imports
import SalaryComponentsPage from '../features/salaryComponents/pages/SalaryComponentsPage';
import EmployeeListPage from '../features/employees/pages/EmployeeListPage';
import EmployeeDetailPage from '../features/employees/pages/EmployeeDetailPage';
import LoginPage from '../features/auth/pages/LoginPage';
import PayrollPage from '../features/payroll/pages/PayrollPage';
import PayrollRunDetailPage from '../features/payroll/pages/PayrollRunDetailPage';
import PayslipDetailPage from '../features/payroll/pages/PayslipDetailPage';
import CompanySelectionPage from '../features/auth/pages/CompanySelectionPage';
import UserManagementPage from '../features/admin/pages/UserManagementPage'; // <-- IMPORT

const Dashboard = () => <Heading size="lg">Dashboard</Heading>;
const Settings = () => <Heading size="lg">Settings</Heading>;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useUser();
    // Check if the user's role in the current tenant is 'admin'
    const isTenantAdmin = user?.tenant?.userRole?.name === 'admin';

    return (
        <Box display="flex">
            <Box w="250px" p={5} borderRight="1px" borderColor="gray.200" h="100vh" bg="gray.50">
                <VStack spacing={4} align="stretch" h="100%">
                    <Heading size="md" mb={6}>Payroll SaaS</Heading>
                    <nav>
                        <VStack spacing={4} align="stretch">
                            <Link to="/">Dashboard</Link>
                            <Link to="/employees">Employees</Link>
                            <Link to="/payroll">Payroll</Link>
                            <Link to="/salary-components">Salary Components</Link>
                            {isTenantAdmin && <Link to="/settings/users">User Management</Link>} {/* <-- CONDITIONAL LINK */}
                            <Link to="/settings">Settings</Link>
                        </VStack>
                    </nav>
                    <Spacer />
                    {user && (
                        <Box>
                            <HStack>
                                <Text fontWeight="bold" noOfLines={1}>{user.tenant.name}</Text>
                                <TenantSwitcher />
                            </HStack>
                            <Tag size="sm" colorScheme="blue" mb={2}>{user.tenant.jurisdiction.name}</Tag>
                            <Text fontSize="sm" color="gray.600">{user.firstName} {user.lastName}</Text>
                            <Button size="sm" mt={4} onClick={logout} variant="outline">Log Out</Button>
                        </Box>
                    )}
                </VStack>
            </Box>
            <Box p={5} flex="1">
                {children}
            </Box>
        </Box>
    )
};

const AppRoutes: React.FC = () => {
    const { user, isLoading } = useUser();

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="100vh"><Spinner size="xl" /></Flex>
        )
    }

    if (!user) {
        // If not logged in, show login page. Also handle the new /select-company route.
        return (
            <Routes>
                <Route path="/select-company" element={<CompanySelectionPage />} />
                <Route path="*" element={<LoginPage />} />
            </Routes>
        )
    }

    return (
        <MainLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/payroll/runs/:runId" element={<PayrollRunDetailPage />} />
                <Route path="/payslips/:payslipId" element={<PayslipDetailPage />} />
                <Route path="/salary-components" element={<SalaryComponentsPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/users" element={<UserManagementPage />} /> {/* <-- NEW ROUTE */}
            </Routes>
        </MainLayout>
    )
}

const App: React.FC = () => {
  return (
    <UserProvider>
        <AppRoutes />
    </UserProvider>
  );
};

export default App;
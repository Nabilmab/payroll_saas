// --- START OF UPDATED FILE ---
// ---
// frontend/src/app/App.tsx
// ---
import React from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';
import SalaryComponentsPage from '../features/salaryComponents/pages/SalaryComponentsPage';
import EmployeeListPage from '../features/employees/pages/EmployeeListPage';
import EmployeeDetailPage from '../features/employees/pages/EmployeeDetailPage';
import LoginPage from '../features/auth/pages/LoginPage';
import PayrollPage from '../features/payroll/pages/PayrollPage';
import PayrollRunDetailPage from '../features/payroll/pages/PayrollRunDetailPage'; // <-- IMPORT
import PayslipDetailPage from '../features/payroll/pages/PayslipDetailPage'; // <-- IMPORT

const Dashboard = () => <Heading size="lg">Dashboard</Heading>;
const Settings = () => <Heading size="lg">Settings</Heading>;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Box display="flex">
        <Box w="250px" p={5} borderRight="1px" borderColor="gray.200" h="100vh">
            <Heading size="md" mb={10}>Payroll SaaS</Heading>
            <nav>
                <VStack spacing={4} align="stretch">
                    <Link to="/">Dashboard</Link>
                    <Link to="/employees">Employees</Link>
                    <Link to="/payroll">Payroll</Link>
                    <Link to="/salary-components">Salary Components</Link>
                    <Link to="/settings">Settings</Link>
                </VStack>
            </nav>
        </Box>
        <Box p={5} flex="1">
            {children}
        </Box>
    </Box>
);

const App: React.FC = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <Routes>
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
          <Route path="/payroll/runs/:runId" element={<PayrollRunDetailPage />} /> {/* <-- ADD ROUTE */}
          <Route path="/payslips/:payslipId" element={<PayslipDetailPage />} /> {/* <-- ADD ROUTE */}
          <Route path="/salary-components" element={<SalaryComponentsPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
    </MainLayout>
  );
};

export default App;
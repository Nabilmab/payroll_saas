import React from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react'; // ChakraProvider removed
import { Routes, Route, Link } from 'react-router-dom'; // BrowserRouter as Router removed
import SalaryComponentsPage from '../features/salaryComponents/pages/SalaryComponentsPage'; // Corrected import path

// Mock Dashboard and Settings components (replace with actual components)
const Dashboard = () => <Heading size="lg">Dashboard</Heading>;
const Settings = () => <Heading size="lg">Settings</Heading>;

const App: React.FC = () => {
  return (
    // ChakraProvider removed
    // Router removed
    <Box p={5}>
      <nav>
        <VStack spacing={4} align="stretch">
              <Link to="/">Dashboard</Link>
              <Link to="/salary-components">Salary Components</Link>
              <Link to="/settings">Settings</Link>
            </VStack>
          </nav>

          <Box mt={10}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/salary-components" element={<SalaryComponentsPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
    // Router removed
    // ChakraProvider removed
  );
};

export default App;
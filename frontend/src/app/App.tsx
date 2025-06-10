import React from 'react';
import { ChakraProvider, Box, Heading, VStack } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SalaryComponentsPage from '../features/salaryComponents/pages/SalaryComponentsPage'; // Corrected import path

// Mock Dashboard and Settings components (replace with actual components)
const Dashboard = () => <Heading size="lg">Dashboard</Heading>;
const Settings = () => <Heading size="lg">Settings</Heading>;

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Router>
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
      </Router>
    </ChakraProvider>
  );
};

export default App;
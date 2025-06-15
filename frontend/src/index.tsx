// --- START OF UPDATED FILE ---
// ---
// frontend/src/index.tsx
// ---
import React, { Suspense } from 'react'; // Import Suspense
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, Spinner, Flex } from '@chakra-ui/react';

import App from './app/App';
import './index.css';
import './i18n'; // Import the i18n configuration

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Fallback component while translations are loading
const loadingMarkup = (
  <Flex justify="center" align="center" h="100vh">
    <Spinner size="xl" />
  </Flex>
);

root.render(
  <React.StrictMode>
    <Suspense fallback={loadingMarkup}>
      <BrowserRouter>
        <ChakraProvider> 
          <App />
        </ChakraProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);
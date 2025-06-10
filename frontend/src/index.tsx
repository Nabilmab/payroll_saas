// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react'; // 1. Import the provider

import App from './app/App';
import './index.css'; // This is optional if Chakra handles all your base styles

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 2. Wrap your entire App with ChakraProvider
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider> 
        <App />
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);
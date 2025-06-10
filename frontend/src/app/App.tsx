// src/app/App.tsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Or import App.module.css

// Placeholder components for pages (you will create these later)
const HomePage = () => <h2>Home Page</h2>;
const LoginPage = () => <h2>Login Page (Feature: Auth)</h2>;
const SalaryComponentsPage = () => <h2>Salary Components Page (Feature: SalaryComponents)</h2>;
const NotFoundPage = () => <h2>404 - Page Not Found</h2>;

function App() {
  return (
    <div className="App">
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/admin/salary-components">Manage Salary Components</Link></li>
        </ul>
      </nav>
      <hr />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* These would later be moved into /features/[featureName]/pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/salary-components" element={<SalaryComponentsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
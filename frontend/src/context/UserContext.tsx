// src/context/UserContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { UserContextProfile } from '../types'; // <-- Import the main profile type

// Define the shape of the context value
interface UserContextType {
  user: UserContextProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserContextProfile | null>>;
  isLoading: boolean;
  logout: () => void;
}

// Create the context with an initial undefined value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
        const token = localStorage.getItem('token');
        const storedProfile = localStorage.getItem('userProfile');

        if (token && storedProfile) {
            setUser(JSON.parse(storedProfile));
        }
    } catch (error) {
        console.error("Failed to parse user profile from localStorage", error);
        setUser(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const logout = () => {
    setIsLoading(true);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('pending_user_id');
    localStorage.removeItem('available_tenants');
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Define and export the custom hook to consume the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
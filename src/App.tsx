import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { FileUpload } from './components/FileUpload';
import { CostInputsPage } from './components/CostInputs';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginPage } from './components/LoginPage';
import { getCurrentUser, initializeUsers } from './utils/userStorage';

function AppContent() {
  const { state } = useApp();

  // Show upload page if no data
  if (state.businessReports.length === 0 || state.searchTermReports.length === 0) {
    return <FileUpload />;
  }

  // Show cost inputs if not configured
  if (state.costInputs.length === 0) {
    return <CostInputsPage />;
  }

  return <Dashboard />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initialize users (ensures admin user exists)
    initializeUsers();
    
    // Check if user is already authenticated
    const currentUser = getCurrentUser();
    const authenticated = localStorage.getItem('app_authenticated') === 'true' && currentUser !== null;
    setIsAuthenticated(authenticated);
    setIsChecking(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onSuccess={handleAuthSuccess} />;
  }

  return (
    <AppProvider>
      <div className="App">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
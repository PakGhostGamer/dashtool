import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { FileUpload } from './components/FileUpload';
import { CostInputsPage } from './components/CostInputs';
import { Dashboard } from './components/dashboard/Dashboard';
import { PasswordProtection } from './components/PasswordProtection';

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
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('app_authenticated') === 'true';
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

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return <PasswordProtection onSuccess={handleAuthSuccess} />;
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
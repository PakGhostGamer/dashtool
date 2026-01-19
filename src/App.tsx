import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { FileUpload } from './components/FileUpload';
import { CostInputsPage } from './components/CostInputs';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginPage } from './components/LoginPage';
import { NavBar } from './components/NavBar';
import { UserManagement } from './components/UserManagement';
import { getCurrentUser, initializeUsers } from './utils/userStorage';
import './utils/debugAdmin'; // Initialize debug utility for console

function AppContent() {
  const { state } = useApp();
  const [showUserManagement, setShowUserManagement] = useState(false);

  const handleNavigateToUsers = () => {
    setShowUserManagement(true);
  };

  const handleNavigateToDashboard = () => {
    setShowUserManagement(false);
  };

  // Show User Management if requested
  if (showUserManagement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar 
          onNavigateToUsers={handleNavigateToUsers} 
          onNavigateToDashboard={handleNavigateToDashboard}
          currentPage="users"
        />
        <div className="container mx-auto px-4 py-6">
          <UserManagement />
        </div>
      </div>
    );
  }

  // Show upload page if no data
  if (state.businessReports.length === 0 || state.searchTermReports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar 
          onNavigateToUsers={handleNavigateToUsers} 
          currentPage="upload"
        />
        <FileUpload />
      </div>
    );
  }

  // Show cost inputs if not configured
  if (state.costInputs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar 
          onNavigateToUsers={handleNavigateToUsers} 
          currentPage="costs"
        />
        <CostInputsPage />
      </div>
    );
  }

  return (
    <>
      <NavBar 
        onNavigateToUsers={handleNavigateToUsers} 
        onNavigateToDashboard={handleNavigateToDashboard}
        currentPage="dashboard"
      />
      <Dashboard />
    </>
  );
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
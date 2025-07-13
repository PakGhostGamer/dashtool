import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { FileUpload } from './components/FileUpload';
import { CostInputsPage } from './components/CostInputs';
import { Dashboard } from './components/dashboard/Dashboard';

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
  return (
    <AppProvider>
      <div className="App">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
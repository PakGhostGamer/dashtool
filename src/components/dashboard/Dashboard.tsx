import React, { useState, useEffect, useMemo } from 'react';
import { FilterBar } from './FilterBar';
import { OverallView } from './OverallView';
import { PPCView } from './PPCView';
import { OrganicView } from './OrganicView';
import { ASINView } from './ASINView';
import { PPCAudit } from './PPCAudit';
import { AIAudit } from './AIAudit';
import { UserManagement } from '../UserManagement';
import { Card, CardContent } from '../ui/Card';
import { MdBarChart, MdOutlineTrackChanges, MdEco, MdInventory, MdSearch, MdPsychology, MdPeople } from 'react-icons/md';
import { getCurrentUser, setCurrentUser, isAdmin } from '../../utils/userStorage';
import '../../utils/debugAdmin'; // Initialize debug utility

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overall');
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());

  useEffect(() => {
    const user = getCurrentUser();
    // Normalize user email to ensure proper admin check
    if (user && user.email) {
      const normalizedEmail = user.email.toLowerCase().trim();
      if (user.email !== normalizedEmail) {
        // Update stored user with normalized email
        user.email = normalizedEmail;
        setCurrentUser(user);
      }
    }
    setCurrentUserState(user);
    
    // If non-admin tries to access users tab, redirect to overall
    if (user && !isAdmin(user) && activeTab === 'users') {
      setActiveTab('overall');
    }
  }, [activeTab]);
  
  // Refresh current user on mount to ensure admin check works
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.email) {
      const normalizedEmail = user.email.toLowerCase().trim();
      if (user.email !== normalizedEmail) {
        user.email = normalizedEmail;
        setCurrentUser(user);
      }
    }
    setCurrentUserState(user);
  }, []);


  // Always recalculate admin status based on current user
  const userIsAdmin = useMemo(() => {
    const adminStatus = isAdmin(currentUser);
    console.log('[Dashboard] Admin check:', { 
      currentUserEmail: currentUser?.email,
      isAdmin: adminStatus 
    });
    return adminStatus;
  }, [currentUser]);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('dashboard-export-tab', handler);

    // Listen for go-to-asin-cost event
    const gotoCostHandler = () => {
      setActiveTab('asin');
      setTimeout(() => {
        const el = document.getElementById('cost-config');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    };
    window.addEventListener('dashboard-goto-asin-cost', gotoCostHandler);

    return () => {
      window.removeEventListener('dashboard-export-tab', handler);
      window.removeEventListener('dashboard-goto-asin-cost', gotoCostHandler);
    };
  }, []);

  const allTabs = [
    { id: 'overall', label: 'Overall Account', icon: <MdBarChart size={20} /> },
    { id: 'ppc', label: 'PPC View', icon: <MdOutlineTrackChanges size={20} /> },
    { id: 'organic', label: 'Organic View', icon: <MdEco size={20} /> },
    { id: 'asin', label: 'ASIN Performance', icon: <MdInventory size={20} /> },
    { id: 'audit', label: 'PPC Audit', icon: <MdSearch size={20} /> },
    { id: 'ai-audit', label: '🤖 AI Insights', icon: <MdPsychology size={20} /> },
    { id: 'users', label: 'User Management', icon: <MdPeople size={20} />, adminOnly: true }
  ];

  // Filter tabs based on admin status - ONLY show User Management to info@ecomgliders.com
  const tabs = React.useMemo(() => {
    // Always get fresh user from storage for admin check
    const freshUser = getCurrentUser();
    const freshAdminCheck = isAdmin(freshUser);
    
    // User Management tab ONLY for admin
    const filtered = allTabs.filter(tab => {
      if (tab.adminOnly) {
        // Must be admin to see this tab
        const showTab = freshAdminCheck;
        console.log('[Dashboard] User Management Tab Check:', { 
          tabId: tab.id, 
          adminOnly: tab.adminOnly, 
          userEmail: freshUser?.email,
          userIsAdmin: userIsAdmin,
          freshAdminCheck: freshAdminCheck,
          showTab: showTab,
          requiredEmail: 'info@ecomgliders.com'
        });
        return showTab;
      }
      return true;
    });
    
    console.log('[Dashboard] Tabs Visible:', filtered.map(t => t.id), {
      currentUser: freshUser?.email,
      isAdmin: freshAdminCheck,
      userManagementVisible: filtered.some(t => t.id === 'users')
    });
    
    return filtered;
  }, [userIsAdmin]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overall':
        return <OverallView />;
      case 'ppc':
        return <PPCView />;
      case 'organic':
        return <OrganicView />;
      case 'asin':
        return <ASINView />;
      case 'audit':
        return <PPCAudit />;
      case 'ai-audit':
        return <AIAudit />;
      case 'users':
        return <UserManagement />;
      default:
        return <OverallView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branding Banner */}
      <div className="relative z-20">
        <div className="mx-auto max-w-7xl px-2 sm:px-4">
          <div className="flex items-center justify-center gap-3 sm:gap-6 py-2 px-3 mt-3 mb-2 rounded-xl shadow-md bg-gradient-to-r from-blue-100/80 via-purple-50/80 to-pink-100/80 border border-blue-100/60 backdrop-blur-md" style={{backdropFilter: 'blur(10px)'}}>
            <span className="text-sm sm:text-base font-semibold text-blue-900 max-w-prose whitespace-normal">
              Want to grow your Amazon business or claim your free audit?
            </span>
            <a
              href="https://ecomgliders.com/get-in-touch/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow hover:from-blue-600 hover:to-purple-600 transition-all duration-150 hover:scale-105"
            >
              Book Now!
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      {/* End Branding Banner */}

      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                {/* 3D Lens SVG */}
                <span className="inline-block">
                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="lensGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#a5b4fc" />
                        <stop offset="60%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </radialGradient>
                    </defs>
                    <ellipse cx="19" cy="19" rx="15" ry="15" fill="url(#lensGradient)" />
                    <ellipse cx="19" cy="19" rx="10" ry="10" fill="#fff" fillOpacity="0.18" />
                    <ellipse cx="15" cy="15" rx="3" ry="2" fill="#fff" fillOpacity="0.45" />
                    <ellipse cx="24" cy="24" rx="2" ry="1.2" fill="#fff" fillOpacity="0.25" />
                    <ellipse cx="19" cy="19" rx="15" ry="15" stroke="#6366f1" strokeWidth="2" fill="none" />
                  </svg>
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" style={{letterSpacing: '-0.01em'}}>
                  eCom Gliders Lens
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <FilterBar />

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {renderContent()}
      </div>
    </div>
  );
}
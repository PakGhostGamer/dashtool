import React, { useState, useEffect } from 'react';
import { FilterBar } from './FilterBar';
import { OverallView } from './OverallView';
import { PPCView } from './PPCView';
import { OrganicView } from './OrganicView';
import { ASINView } from './ASINView';
import { PPCAudit } from './PPCAudit';
import { AIAudit } from './AIAudit';
import { Card, CardContent } from '../ui/Card';
import { MdBarChart, MdOutlineTrackChanges, MdEco, MdInventory, MdSearch, MdPsychology } from 'react-icons/md';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overall');

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

  const tabs = [
    { id: 'overall', label: 'Overall Account', icon: <MdBarChart size={20} /> },
    { id: 'ppc', label: 'PPC View', icon: <MdOutlineTrackChanges size={20} /> },
    { id: 'organic', label: 'Organic View', icon: <MdEco size={20} /> },
    { id: 'asin', label: 'ASIN Performance', icon: <MdInventory size={20} /> },
    { id: 'audit', label: 'PPC Audit', icon: <MdSearch size={20} /> },
    { id: 'ai-audit', label: '🤖 AI Insights', icon: <MdPsychology size={20} /> }
  ];

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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center" style={{letterSpacing: '-0.01em'}}>
                eCom Gliders Lens
              </h1>
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
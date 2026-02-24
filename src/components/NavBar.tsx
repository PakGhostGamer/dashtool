import React from 'react';
import { Button } from './ui/Button';
import { LogOut, Users } from 'lucide-react';
import { getCurrentUser, setCurrentUser, isAdmin } from '../utils/userStorage';

interface NavBarProps {
  onNavigateToUsers?: () => void;
  onNavigateToDashboard?: () => void;
  currentPage?: 'dashboard' | 'users' | 'upload' | 'costs';
}

export function NavBar({ onNavigateToUsers, onNavigateToDashboard, currentPage }: NavBarProps) {
  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      setCurrentUser(null);
      window.location.reload();
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo/Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onNavigateToDashboard}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigateToDashboard?.();
              }
            }}
          >
            <span className="inline-block">
              <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="navLensGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="60%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </radialGradient>
                </defs>
                <ellipse cx="19" cy="19" rx="15" ry="15" fill="url(#navLensGradient)" />
                <ellipse cx="19" cy="19" rx="10" ry="10" fill="#fff" fillOpacity="0.18" />
                <ellipse cx="15" cy="15" rx="3" ry="2" fill="#fff" fillOpacity="0.45" />
                <ellipse cx="24" cy="24" rx="2" ry="1.2" fill="#fff" fillOpacity="0.25" />
                <ellipse cx="19" cy="19" rx="15" ry="15" stroke="#6366f1" strokeWidth="2" fill="none" />
              </svg>
            </span>
            <h1 className="text-xl font-bold text-gray-900">eCom Gliders Lens</h1>
          </div>

          {/* Right side - Navigation and User Info */}
          <div className="flex items-center gap-4">
            {/* User Management Link - Only for Admin */}
            {userIsAdmin && (
              <>
                {currentPage === 'users' && onNavigateToDashboard ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToDashboard}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </Button>
                ) : onNavigateToUsers ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToUsers}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </Button>
                ) : null}
              </>
            )}

            {/* User Email */}
            {currentUser && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {currentUser.email}
              </span>
            )}

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
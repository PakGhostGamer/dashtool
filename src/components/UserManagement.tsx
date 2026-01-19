import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { UserPlus, Trash2, Mail, Calendar, Shield } from 'lucide-react';
import { getUsers, addUser, deleteUser, getCurrentUser, isAdmin, initializeUsers, User } from '../utils/userStorage';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  useEffect(() => {
    // Initialize users first
    initializeUsers();
    
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Check admin status
    const adminCheck = user && isAdmin(user);
    
    // Only load users if admin
    if (adminCheck) {
      loadUsers();
    }
    
    setIsChecking(false);
  }, []);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // HARD CHECK: Only info@ecomgliders.com can access
  const adminCheck = currentUser && isAdmin(currentUser);
  
  if (!adminCheck) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access User Management. Only administrators can manage users.</p>
            <p className="text-sm text-gray-500 mt-2">Current user: {currentUser?.email || 'Not logged in'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!newEmail.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!newPassword.trim()) {
      setError('Password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulate delay
    setTimeout(() => {
      const result = addUser(newEmail, newPassword);

      if (result) {
        setSuccess(`User ${newEmail} has been created successfully!`);
        setNewEmail('');
        setNewPassword('');
        setConfirmPassword('');
        loadUsers();
      } else {
        setError('A user with this email already exists');
      }

      setIsLoading(false);
    }, 300);
  };

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    const success = deleteUser(userId);
    if (success) {
      setSuccess(`User ${userEmail} has been deleted successfully!`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          </div>
          <p className="text-gray-600 mt-2">Add and manage users for the application</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="email"
                label="Email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isLoading}
              />
              <Input
                type="password"
                label="Password"
                placeholder="Enter password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <Input
                type="password"
                label="Confirm Password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {(error || success) && (
              <div
                className={`p-3 rounded-md ${
                  error
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {error || success}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !newEmail.trim() || !newPassword.trim() || !confirmPassword.trim()}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? 'Adding User...' : 'Add User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900">Existing Users</h3>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found. Add a user to get started.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.email}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
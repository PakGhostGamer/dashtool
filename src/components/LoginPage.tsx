import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Lock, Mail } from 'lucide-react';
import { authenticateUser, initializeUsers, setCurrentUser } from '../utils/userStorage';

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    // Initialize users if needed
    initializeUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      const user = authenticateUser(email, password);
      
      if (user) {
        // Store current user and authentication
        setCurrentUser(user);
        setIsLoading(false);
        onSuccess();
      } else {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
        setPassword('');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Login</h1>
          <p className="text-gray-600 mt-2">Please enter your email and password to access the application</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email.trim() ? error : undefined}
              disabled={isLoading}
              autoFocus
            />
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && email.trim() ? error : undefined}
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
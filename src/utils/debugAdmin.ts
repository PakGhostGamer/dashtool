// Debug utility to check admin status
import { getCurrentUser, isAdmin } from './userStorage';

export function debugAdminStatus() {
  const user = getCurrentUser();
  const admin = isAdmin(user);
  
  console.log('=== ADMIN STATUS DEBUG ===');
  console.log('Current User:', user);
  console.log('User Email:', user?.email);
  console.log('User Email (normalized):', user?.email?.toLowerCase().trim());
  console.log('Is Admin:', admin);
  console.log('Expected Admin Email: info@ecomgliders.com');
  console.log('Expected Admin Email (normalized):', 'info@ecomgliders.com'.toLowerCase().trim());
  console.log('Match:', user?.email?.toLowerCase().trim() === 'info@ecomgliders.com'.toLowerCase().trim());
  console.log('========================');
  
  return {
    user,
    isAdmin: admin,
    email: user?.email,
    emailNormalized: user?.email?.toLowerCase().trim(),
    expectedEmail: 'info@ecomgliders.com',
    expectedEmailNormalized: 'info@ecomgliders.com'.toLowerCase().trim(),
    matches: user?.email?.toLowerCase().trim() === 'info@ecomgliders.com'.toLowerCase().trim()
  };
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAdmin = debugAdminStatus;
  console.log('✅ debugAdmin() function available in console. Use debugAdmin() to check admin status.');
}

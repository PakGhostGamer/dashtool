export interface User {
  id: string;
  name?: string;
  email: string;
  password: string; // In production, this should be hashed
  createdAt: string;
  lastLoginAt?: string;
  loginHistory?: string[]; // Array of login timestamps
}

const USERS_STORAGE_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';
// HARDCODED ADMIN - ONLY THIS USER IS ADMIN
const ADMIN_EMAIL = 'info@ecomgliders.com';
const ADMIN_PASSWORD = 'Tool.ecomgliders.11';

// Initialize with default admin user if no users exist
export function initializeUsers() {
  const users = getUsers();
  const adminEmailLower = ADMIN_EMAIL.toLowerCase();
  const adminExists = users.some(u => u.email?.toLowerCase() === adminEmailLower);
  
  // Always ensure admin user exists with correct credentials
  if (users.length === 0 || !adminExists) {
    // Remove any existing admin user (in case email changed)
    const filteredUsers = users.filter(u => u.email?.toLowerCase() !== adminEmailLower);
    const defaultAdmin: User = {
      id: '1',
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Should be hashed in production
      createdAt: new Date().toISOString()
    };
    saveUsers([...filteredUsers, defaultAdmin]);
  } else {
    // Update admin password if admin exists but password might be wrong
    const adminIndex = users.findIndex(u => u.email?.toLowerCase() === adminEmailLower);
    if (adminIndex !== -1) {
      users[adminIndex].password = ADMIN_PASSWORD;
      users[adminIndex].email = ADMIN_EMAIL; // Ensure exact email match
      saveUsers(users);
    }
  }
}

// Check if a user is admin - ONLY info@ecomgliders.com
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) {
    return false;
  }
  // HARDCODED: Only this exact email is admin
  const userEmail = user.email.toLowerCase().trim();
  const adminEmail = ADMIN_EMAIL.toLowerCase().trim(); // 'info@ecomgliders.com'
  const isAdminUser = userEmail === adminEmail;
  
  // Debug log
  console.log('[isAdmin] Admin Check:', { 
    userEmail: user.email,
    userEmailNormalized: userEmail, 
    adminEmailRequired: ADMIN_EMAIL,
    adminEmailNormalized: adminEmail, 
    isAdmin: isAdminUser,
    match: userEmail === adminEmail
  });
  
  return isAdminUser;
}

// Export admin email for reference
export const ADMIN_EMAIL_CONSTANT = ADMIN_EMAIL;

export function getUsers(): User[] {
  try {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error reading users from localStorage:', error);
    return [];
  }
}

export function saveUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
}

export function addUser(email: string, password: string, name?: string): User | null {
  const users = getUsers();
  
  // Check if user with email already exists
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return null; // User already exists
  }

  const newUser: User = {
    id: Date.now().toString(),
    name: name?.trim() || undefined,
    email: email.toLowerCase(),
    password, // Should be hashed in production
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function authenticateUser(email: string, password: string): User | null {
  const users = getUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const userIndex = users.findIndex(
    u => u.email?.toLowerCase().trim() === normalizedEmail && u.password === password
  );
  
  if (userIndex !== -1) {
    const user = users[userIndex];
    const loginTime = new Date().toISOString();
    
    // Update last login time
    user.lastLoginAt = loginTime;
    
    // Update login history (keep last 10 logins)
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    user.loginHistory.push(loginTime);
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10); // Keep only last 10
    }
    
    // Normalize email
    user.email = user.email.toLowerCase().trim();
    
    // Save updated user
    users[userIndex] = user;
    saveUsers(users);
    
    return user;
  }
  return null;
}

export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error reading current user:', error);
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem('app_authenticated', 'true');
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('app_authenticated');
  }
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const users = getUsers();
  const userToDelete = users.find(u => u.id === userId);
  
  if (!userToDelete) {
    return { success: false, error: 'User not found' };
  }
  
  // Prevent admin deletion
  if (isAdmin(userToDelete)) {
    return { success: false, error: 'Admin user cannot be deleted' };
  }
  
  const filteredUsers = users.filter(u => u.id !== userId);
  saveUsers(filteredUsers);
  
  // If deleted user is current user, logout
  const currentUser = getCurrentUser();
  if (currentUser?.id === userId) {
    setCurrentUser(null);
  }
  
  return { success: true };
}
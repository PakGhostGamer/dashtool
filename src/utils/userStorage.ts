export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  createdAt: string;
}

const USERS_STORAGE_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';
const ADMIN_EMAIL = 'info@ecomgliders.com';

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
      email: ADMIN_EMAIL,
      password: 'Tool.ecomgliders.11', // Should be hashed in production
      createdAt: new Date().toISOString()
    };
    saveUsers([...filteredUsers, defaultAdmin]);
  } else {
    // Update admin password if admin exists but password might be wrong
    const adminIndex = users.findIndex(u => u.email?.toLowerCase() === adminEmailLower);
    if (adminIndex !== -1) {
      users[adminIndex].password = 'Tool.ecomgliders.11';
      users[adminIndex].email = ADMIN_EMAIL; // Ensure exact email match
      saveUsers(users);
    }
  }
}

// Check if a user is admin
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const userEmail = user.email?.toLowerCase().trim();
  const adminEmail = ADMIN_EMAIL.toLowerCase().trim();
  return userEmail === adminEmail;
}

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

export function addUser(email: string, password: string): User | null {
  const users = getUsers();
  
  // Check if user with email already exists
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return null; // User already exists
  }

  const newUser: User = {
    id: Date.now().toString(),
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
  const user = users.find(
    u => u.email?.toLowerCase().trim() === normalizedEmail && u.password === password
  );
  // Ensure the returned user has normalized email
  if (user) {
    return {
      ...user,
      email: user.email.toLowerCase().trim()
    };
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

export function deleteUser(userId: string): boolean {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length === users.length) {
    return false; // User not found
  }
  
  saveUsers(filteredUsers);
  
  // If deleted user is current user, logout
  const currentUser = getCurrentUser();
  if (currentUser?.id === userId) {
    setCurrentUser(null);
  }
  
  return true;
}
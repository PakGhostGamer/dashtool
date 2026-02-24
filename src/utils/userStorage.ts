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

// Default dashboard user (can login, not admin)
const MOHSIN_EMAIL = 'mohsin@ecomgliders.com';
const MOHSIN_PASSWORD = 'Mohsin.11';

// Initialize with default admin user if no users exist.
// Only adds/updates admin and mohsin in place; never removes other users (deleted users stay deleted).
export function initializeUsers() {
  const users = getUsers();
  console.log('[initializeUsers] Called', { userCount: users.length, emails: users.map(u => u.email) });
  const adminEmailLower = ADMIN_EMAIL.toLowerCase();
  const mohsinEmailLower = MOHSIN_EMAIL.toLowerCase();

  // 1) Ensure admin exists and has correct credentials (in place, don't replace list)
  const adminIndex = users.findIndex(u => u.email?.toLowerCase() === adminEmailLower);
  if (adminIndex !== -1) {
    users[adminIndex].password = ADMIN_PASSWORD;
    users[adminIndex].email = ADMIN_EMAIL;
  } else {
    const defaultAdmin: User = {
      id: '1',
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      createdAt: new Date().toISOString()
    };
    users.push(defaultAdmin);
  }

  // 2) Ensure mohsin exists and has correct credentials (in place, same list)
  const mohsinIndex = users.findIndex(u => u.email?.toLowerCase() === mohsinEmailLower);
  if (mohsinIndex !== -1) {
    users[mohsinIndex].password = MOHSIN_PASSWORD;
    users[mohsinIndex].email = MOHSIN_EMAIL;
  } else {
    const mohsinUser: User = {
      id: (Date.now() + 1).toString(),
      name: 'Mohsin',
      email: MOHSIN_EMAIL,
      password: MOHSIN_PASSWORD,
      createdAt: new Date().toISOString()
    };
    users.push(mohsinUser);
  }

  // Single save: all existing users (including any created in User Management) are preserved
  saveUsers(users);
  console.log('[initializeUsers] Done', { userCount: users.length, emails: users.map(u => u.email) });
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
  const emailNormalized = email.trim().toLowerCase();
  const passwordTrimmed = password.trim();

  console.log('[addUser] Called with', { emailNormalized, passwordLength: passwordTrimmed.length, existingUserCount: users.length, storedEmails: users.map(u => u.email) });

  if (users.some(u => u.email?.toLowerCase().trim() === emailNormalized)) {
    console.log('[addUser] User already exists, skipping');
    return null;
  }

  const newUser: User = {
    id: Date.now().toString(),
    name: name?.trim() || undefined,
    email: emailNormalized,
    password: passwordTrimmed,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  console.log('[addUser] Saved new user', { email: newUser.email, id: newUser.id, totalUsers: users.length });
  return newUser;
}

export function authenticateUser(email: string, password: string): User | null {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordTrimmed = password.trim();

  console.log('[authenticateUser] Login attempt', {
    normalizedEmail,
    passwordLength: passwordTrimmed.length,
    totalUsers: users.length,
    storedEmails: users.map(u => u.email),
  });

  users.forEach((u, i) => {
    const emailMatch = (u.email || '').toLowerCase().trim() === normalizedEmail;
    const storedPw = (u.password || '').trim();
    const passwordMatch = storedPw === passwordTrimmed;
    if (emailMatch) {
      console.log('[authenticateUser] User found by email', {
        index: i,
        storedEmail: u.email,
        emailMatch,
        passwordMatch,
        storedPasswordLength: storedPw.length,
        inputPasswordLength: passwordTrimmed.length,
      });
    }
  });

  const userIndex = users.findIndex(
    u => u.email?.toLowerCase().trim() === normalizedEmail && (u.password || '').trim() === passwordTrimmed
  );
  
  if (userIndex !== -1) {
    console.log('[authenticateUser] Success', { email: users[userIndex].email });
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
  console.log('[authenticateUser] No matching user, login failed');
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
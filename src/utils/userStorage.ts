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

// Only ensures admin and mohsin exist; never removes or overwrites other users.
export function initializeUsers() {
  const users = getUsers();
  console.log('[initializeUsers] Called', { userCount: users.length, emails: users.map(u => u.email), storageKey: USERS_STORAGE_KEY });
  const adminEmailLower = ADMIN_EMAIL.toLowerCase();
  const mohsinEmailLower = MOHSIN_EMAIL.toLowerCase();

  let changed = false;
  let list = [...users];

  const adminIndex = list.findIndex(u => (u.email || '').toLowerCase() === adminEmailLower);
  if (adminIndex !== -1) {
    list[adminIndex] = { ...list[adminIndex], password: ADMIN_PASSWORD, email: ADMIN_EMAIL };
    changed = true;
  } else {
    list = [...list, { id: '1', name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, createdAt: new Date().toISOString() }];
    changed = true;
  }

  const mohsinIndex = list.findIndex(u => (u.email || '').toLowerCase() === mohsinEmailLower);
  if (mohsinIndex !== -1) {
    list[mohsinIndex] = { ...list[mohsinIndex], password: MOHSIN_PASSWORD, email: MOHSIN_EMAIL };
    changed = true;
  } else {
    list = [...list, { id: (Date.now() + 1).toString(), name: 'Mohsin', email: MOHSIN_EMAIL, password: MOHSIN_PASSWORD, createdAt: new Date().toISOString() }];
    changed = true;
  }

  if (changed) {
    saveUsers(list);
  }
  console.log('[initializeUsers] Done', { userCount: list.length, emails: list.map(u => u.email) });
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
    const json = JSON.stringify(users);
    localStorage.setItem(USERS_STORAGE_KEY, json);
  } catch (error) {
    console.error('[saveUsers] Error saving to localStorage:', error, 'key:', USERS_STORAGE_KEY);
  }
}

export function addUser(email: string, password: string, name?: string): User | null {
  const emailNormalized = email.trim().toLowerCase();
  const passwordTrimmed = password.trim();

  const users = getUsers();
  console.log('[addUser] Called', { emailNormalized, passwordLength: passwordTrimmed.length, existingCount: users.length, storageKey: USERS_STORAGE_KEY });

  if (users.some(u => (u.email || '').toLowerCase().trim() === emailNormalized)) {
    console.log('[addUser] User already exists');
    return null;
  }

  const newUser: User = {
    id: Date.now().toString(),
    name: name?.trim() || undefined,
    email: emailNormalized,
    password: passwordTrimmed,
    createdAt: new Date().toISOString()
  };

  // Save as new array so we never mutate the array returned by getUsers()
  const updatedList = [...users, newUser];
  saveUsers(updatedList);

  // Verify it was stored
  const afterSave = getUsers();
  const found = afterSave.some(u => (u.email || '').toLowerCase().trim() === emailNormalized);
  if (!found) {
    console.error('[addUser] Save failed: user not found after save. Read back count:', afterSave.length, 'expected:', updatedList.length);
    // Retry once with fresh read
    const retryList = getUsers();
    if (!retryList.some(u => (u.email || '').toLowerCase().trim() === emailNormalized)) {
      retryList.push(newUser);
      saveUsers(retryList);
      const verifyAgain = getUsers();
      if (!verifyAgain.some(u => (u.email || '').toLowerCase().trim() === emailNormalized)) {
        console.error('[addUser] Retry also failed. Check Application > Local Storage for key:', USERS_STORAGE_KEY);
      } else {
        console.log('[addUser] Retry succeeded');
      }
    }
  } else {
    console.log('[addUser] Saved and verified', { email: newUser.email, totalUsers: afterSave.length });
  }
  return newUser;
}

export function authenticateUser(email: string, password: string): User | null {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordTrimmed = password.trim();

  const storedEmailsList = users.map(u => u.email);
  console.log('[authenticateUser] Login attempt', {
    normalizedEmail,
    passwordLength: passwordTrimmed.length,
    totalUsers: users.length,
    storedEmails: storedEmailsList,
    storedEmailsStr: storedEmailsList.join(' | '),
  });
  if (users.length > 0 && !storedEmailsList.some(e => (e || '').toLowerCase().trim() === normalizedEmail)) {
    console.warn('[authenticateUser] Your email is not in the stored list. Stored users:', storedEmailsList.join(', '), '- Create this user in User Management on THIS same website (same URL) and try again.');
  }

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
    if (!userJson) return null;
    const parsed = JSON.parse(userJson) as User;
    if (!parsed || typeof parsed !== 'object' || !parsed.email) return null;
    return parsed;
  } catch (error) {
    console.error('Error reading current user:', error);
    return null;
  }
}

/** Use this on app load: returns current user only if session is valid and user still exists in list. Keeps session on reload. */
export function getValidSessionUser(): User | null {
  const authFlag = localStorage.getItem('app_authenticated');
  if (authFlag !== 'true') return null;
  const user = getCurrentUser();
  if (!user || !user.id) return null;
  const users = getUsers();
  const stillExists = users.some(u => (u.id && u.id === user.id) || (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase());
  if (!stillExists) {
    setCurrentUser(null);
    return null;
  }
  return user;
}

export function setCurrentUser(user: User | null) {
  if (user) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem('app_authenticated', 'true');
    } catch (e) {
      console.error('Error saving current user:', e);
    }
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
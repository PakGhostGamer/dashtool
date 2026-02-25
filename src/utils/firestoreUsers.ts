import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from './userStorage';

const USERS_COLLECTION = 'users';

function toFirestoreUser(u: User): Record<string, unknown> {
  return {
    id: u.id,
    email: u.email,
    password: u.password,
    name: u.name ?? null,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt ?? null,
    loginHistory: u.loginHistory ?? null,
  };
}

function fromFirestoreDoc(data: Record<string, unknown>): User {
  return {
    id: String(data.id ?? ''),
    email: String(data.email ?? ''),
    password: String(data.password ?? ''),
    name: data.name != null ? String(data.name) : undefined,
    createdAt: String(data.createdAt ?? ''),
    lastLoginAt: data.lastLoginAt != null ? String(data.lastLoginAt) : undefined,
    loginHistory: Array.isArray(data.loginHistory) ? (data.loginHistory as string[]) : undefined,
  };
}

export async function getUsersFromFirestore(db: Firestore): Promise<User[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  const users: User[] = [];
  snap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    data.id = data.id ?? d.id;
    users.push(fromFirestoreDoc(data));
  });
  return users;
}

export async function addUserToFirestore(db: Firestore, user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.id);
  await setDoc(ref, toFirestoreUser(user));
}

export async function updateUserInFirestore(db: Firestore, user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.id);
  await setDoc(ref, toFirestoreUser(user), { merge: true });
}

export async function deleteUserFromFirestore(db: Firestore, userId: string): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(ref);
}

export async function setUsersInFirestore(db: Firestore, users: User[]): Promise<void> {
  const batch = writeBatch(db);
  for (const u of users) {
    const ref = doc(db, USERS_COLLECTION, u.id);
    batch.set(ref, toFirestoreUser(u));
  }
  await batch.commit();
}

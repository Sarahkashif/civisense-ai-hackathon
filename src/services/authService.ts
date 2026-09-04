import type { User } from '../types';
import { dbSignUpUser, dbLoginUser } from './databaseService';

const SESSION_KEY = 'civisense_current_user';

/**
 * Auth service — manages authentication via Supabase (or localStorage fallback).
 * Session data is cached in localStorage for fast startup.
 */

function generateUserId(): string {
  return `user-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Sign up a new user. Returns the user on success, or an error message. */
export async function signUp(
  fullName: string,
  email: string,
  phone: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPhone || !password) {
    return { user: null, error: 'All fields are required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { user: null, error: 'Please enter a valid email address.' };
  }

  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters.' };
  }

  const userId = generateUserId();
  const result = await dbSignUpUser(trimmedName, trimmedEmail, trimmedPhone, password, userId);

  if (result.user) {
    // Cache session in localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
  }

  return result;
}

/** Log in an existing user. Returns the user on success, or an error message. */
export async function login(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return { user: null, error: 'Email and password are required.' };
  }

  const result = await dbLoginUser(trimmedEmail, password);

  if (result.user) {
    // Cache session in localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
  }

  return result;
}

/** Log out the current user. */
export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Get the currently logged-in user from cache, or null. */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

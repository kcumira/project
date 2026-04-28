export interface AuthUser {
  userId: number;
  userName: string;
  email: string;
  role: string;
  lineId?: string | null;
}

const STORAGE_KEY = 'smartfood:user';

export function getCurrentUser(): AuthUser | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as AuthUser;
    return typeof user.userId === 'number' ? user : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setCurrentUser(user: AuthUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}


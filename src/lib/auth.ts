import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';
import {
  clearAuthCache,
  isAuthCacheValid,
  isDemoAuthEnabled,
  persistAuthCache,
  readAuthCache,
  setDemoAuthEnabled,
} from './authStorage';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/chat');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

function getDemoUser(): User {
  return {
    uid: 'demo_tycoon_user',
    email: 'hubi666hubi@gmail.com',
    displayName: 'Tycoon Sandbox User',
    emailVerified: true,
    isAnonymous: false,
    providerId: 'google.com',
  } as unknown as User;
}

function syncCachedToken(token: string | null): void {
  cachedAccessToken = token;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (isDemoAuthEnabled()) {
    const cache = readAuthCache();
    const token = cache.accessToken ?? 'dummy_demo_token';
    syncCachedToken(token);
    if (onAuthSuccess) {
      setTimeout(() => onAuthSuccess(getDemoUser(), token), 0);
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (isDemoAuthEnabled()) {
      return;
    }

    const cache = readAuthCache();

    if (user) {
      if (cachedAccessToken || isAuthCacheValid(cache)) {
        const token = cachedAccessToken ?? cache.accessToken ?? null;
        if (token && onAuthSuccess) {
          onAuthSuccess(user, token);
        }
        return;
      }

      if (!isSigningIn) {
        syncCachedToken(null);
        clearAuthCache();
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
      return;
    }

    syncCachedToken(null);
    clearAuthCache();
    if (onAuthFailure) {
      onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    const token = credential.accessToken;
    persistAuthCache(token);
    syncCachedToken(token);

    return { user: result.user, accessToken: token };
  } catch (error: unknown) {
    const isUserCancelled = error instanceof Error && 'code' in error && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request');
    if (!isUserCancelled) {
      console.error('Sign in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const cache = readAuthCache();
  if (isAuthCacheValid(cache)) {
    syncCachedToken(cache.accessToken);
    return cache.accessToken;
  }

  clearAuthCache();
  return null;
};

export const signInAsDemoUser = async (): Promise<{ user: User; accessToken: string }> => {
  const dummyUser = getDemoUser();
  const token = 'dummy_demo_token';

  persistAuthCache(token, 24 * 60 * 60 * 1000);
  setDemoAuthEnabled(true);
  syncCachedToken(token);

  return { user: dummyUser, accessToken: token };
};

export const logout = async () => {
  await auth.signOut();
  syncCachedToken(null);
  clearAuthCache();
  setDemoAuthEnabled(false);
};

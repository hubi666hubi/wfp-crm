import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
// Request Workspace scopes
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/chat');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

const CACHE_KEY = 'oauth_access_token';
const EXPIRY_KEY = 'oauth_token_expiry';

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if we are signed in as demo user first to support sandbox mode fallback
  const isDemo = localStorage.getItem('auth_demo_logged_in') === 'true';
  if (isDemo) {
    const dummyUser = {
      uid: 'demo_tycoon_user',
      email: 'hubi666hubi@gmail.com',
      displayName: 'Tycoon Sandbox User',
      emailVerified: true,
      isAnonymous: false,
      providerId: 'google.com',
    } as unknown as User;
    const token = localStorage.getItem(CACHE_KEY) || 'dummy_demo_token';
    if (onAuthSuccess) {
      setTimeout(() => onAuthSuccess(dummyUser, token), 0);
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (localStorage.getItem('auth_demo_logged_in') === 'true') {
      return; // Ignore standard auth changes if in demo-sandbox mode
    }
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        const storedToken = localStorage.getItem(CACHE_KEY);
        const storedExpiry = localStorage.getItem(EXPIRY_KEY);
        
        if (storedToken && storedExpiry && new Date().getTime() < parseInt(storedExpiry, 10)) {
          cachedAccessToken = storedToken;
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(EXPIRY_KEY);
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      if (onAuthFailure) onAuthFailure();
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

    cachedAccessToken = credential.accessToken;
    const expiry = new Date().getTime() + 50 * 60 * 1000; // 50 minutes valid time for cached token
    localStorage.setItem(CACHE_KEY, cachedAccessToken);
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      console.error('Sign in error:', error);
    } else if (!(error instanceof Error) || !('code' in error)) {
      console.error('Sign in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;

  const storedToken = localStorage.getItem(CACHE_KEY);
  const storedExpiry = localStorage.getItem(EXPIRY_KEY);

  if (storedToken && storedExpiry && new Date().getTime() < parseInt(storedExpiry, 10)) {
    cachedAccessToken = storedToken;
    return cachedAccessToken;
  }

  return null;
};

export const signInAsDemoUser = async (): Promise<{ user: User; accessToken: string }> => {
  const dummyUser = {
    uid: 'demo_tycoon_user',
    email: 'hubi666hubi@gmail.com',
    displayName: 'Tycoon Sandbox User',
    emailVerified: true,
    isAnonymous: false,
    providerId: 'google.com',
  } as unknown as User;
  
  cachedAccessToken = 'dummy_demo_token';
  localStorage.setItem('auth_demo_logged_in', 'true');
  localStorage.setItem(CACHE_KEY, cachedAccessToken);
  localStorage.setItem(EXPIRY_KEY, (new Date().getTime() + 24 * 60 * 60 * 1000).toString());
  
  return { user: dummyUser, accessToken: cachedAccessToken };
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem('auth_demo_logged_in');
};

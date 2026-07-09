// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout, getAccessToken, signInAsDemoUser } from './auth';
import { auth } from './firebase';

vi.mock('./firebase', () => ({
  auth: {
    signOut: vi.fn(),
  },
}));

// We also need to mock firebase/auth so that initAuth doesn't fail if imported
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {
    addScope() {}
    static credentialFromResult() { return { accessToken: 'token' }; }
  },
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('auth.ts', () => {
  describe('logout', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
    });

    it('should call auth.signOut and clear localStorage and cached token', async () => {
      // Set up initial state by calling signInAsDemoUser
      await signInAsDemoUser();

      // Ensure it is set
      expect(localStorage.getItem('oauth_access_token')).toBe('dummy_demo_token');
      expect(getAccessToken()).toBe('dummy_demo_token');

      // Call logout
      await logout();

      // Assert auth.signOut was called
      expect(auth.signOut).toHaveBeenCalledTimes(1);

      // Assert localStorage is cleared
      expect(localStorage.getItem('oauth_access_token')).toBeNull();
      expect(localStorage.getItem('oauth_token_expiry')).toBeNull();
      expect(localStorage.getItem('auth_demo_logged_in')).toBeNull();

      // Assert cached token is null
      expect(getAccessToken()).toBeNull();
    });
  });
});

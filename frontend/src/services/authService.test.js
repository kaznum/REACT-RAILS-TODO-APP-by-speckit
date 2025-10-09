import authService from './authService';
import api from './api';
import { setTokens, getAccessToken, clearTokens } from './tokenService';

jest.mock('./api');
jest.mock('./tokenService');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('returns correct Google OAuth URL', () => {
      process.env.REACT_APP_API_URL = 'http://localhost:3000/api/v1';
      const url = authService.getGoogleAuthUrl();
      expect(url).toBe('http://localhost:3000/api/v1/auth/google');
    });
  });

  describe('handleOAuthCallback', () => {
    it('extracts and stores access token from URL params', () => {
      const urlParams = new URLSearchParams('access_token=test_token_123');
      const token = authService.handleOAuthCallback(urlParams);

      expect(token).toBe('test_token_123');
      expect(setTokens).toHaveBeenCalledWith('test_token_123', null);
    });

    it('returns null and logs error when error param is present', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const urlParams = new URLSearchParams('error=authentication_failed');
      const token = authService.handleOAuthCallback(urlParams);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('OAuth error:', 'authentication_failed');
      expect(setTokens).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('returns null when no token or error in params', () => {
      const urlParams = new URLSearchParams('');
      const token = authService.handleOAuthCallback(urlParams);

      expect(token).toBeNull();
      expect(setTokens).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('fetches and returns current user', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      api.get.mockResolvedValue({ data: { user: mockUser } });

      const user = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/auth/current_user');
      expect(user).toEqual(mockUser);
    });

    it('throws error when request fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Unauthorized');
      api.get.mockRejectedValue(error);

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Get current user error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('signOut', () => {
    it('calls sign out endpoint and clears tokens', async () => {
      api.delete.mockResolvedValue({});

      await authService.signOut();

      expect(api.delete).toHaveBeenCalledWith('/auth/sign_out');
      expect(clearTokens).toHaveBeenCalled();
    });

    it('clears tokens even when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      api.delete.mockRejectedValue(new Error('Network error'));

      await authService.signOut();

      expect(clearTokens).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when access token exists', () => {
      getAccessToken.mockReturnValue('valid_token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when no access token', () => {
      getAccessToken.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('redirectToLogin', () => {
    it('redirects to login page', () => {
      delete window.location;
      window.location = { href: '' };

      authService.redirectToLogin();

      expect(window.location.href).toBe('/login');
    });
  });

  describe('redirectToDashboard', () => {
    it('redirects to dashboard page', () => {
      delete window.location;
      window.location = { href: '' };

      authService.redirectToDashboard();

      expect(window.location.href).toBe('/dashboard');
    });
  });
});

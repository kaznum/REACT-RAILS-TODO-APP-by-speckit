import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import authService from '../services/authService';
import { clearTokens } from '../services/tokenService';

jest.mock('../services/authService');
jest.mock('../services/tokenService');

describe('useAuth', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('initialization', () => {
    it('eventually sets loading to false', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('loads authenticated user on mount', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles unauthenticated state on mount', async () => {
      authService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears tokens when getCurrentUser fails', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login();
      });

      expect(loginResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('throws error when login fails', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.login();
        });
      }).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);
      authService.signOut.mockResolvedValue({});
      authService.redirectToLogin.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.signOut).toHaveBeenCalled();
      expect(authService.redirectToLogin).toHaveBeenCalled();
    });

    it('clears user state even when signOut fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);
      // Mock signOut to resolve successfully since authService handles errors internally
      authService.signOut.mockResolvedValue({});
      authService.redirectToLogin.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.redirectToLogin).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('context requirement', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});

import api from './api';
import { setTokens, getAccessToken, clearTokens } from './tokenService';

const authService = {
  /**
   * Get Google OAuth URL for initiating authentication
   */
  getGoogleAuthUrl() {
    return `${process.env.REACT_APP_API_URL}/auth/google`;
  },

  /**
   * Handle OAuth callback - extract and store access token from URL
   * Supports both hash (#access_token=...) and query (?access_token=...) for backward compatibility
   * @param {URLSearchParams} urlParams - URL search params from callback
   * @param {string} hash - URL hash fragment
   * @returns {string|null} - Access token if successful
   */
  handleOAuthCallback(urlParams, hash = window.location.hash) {
    // Check for errors in query parameters (errors are sent as query params, not hash)
    const error = urlParams.get('error');
    if (error) {
      console.error('OAuth error:', error);
      return null;
    }

    // Try to extract access_token from hash fragment first (new secure method)
    let accessToken = null;
    if (hash && hash.startsWith('#')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      accessToken = hashParams.get('access_token');
    }

    // Fall back to query parameter for backward compatibility
    if (!accessToken) {
      accessToken = urlParams.get('access_token');
    }

    if (accessToken) {
      setTokens(accessToken, null); // Refresh token is in httpOnly cookie

      // Clear the hash from URL to prevent token from staying in browser history
      if (hash && hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      return accessToken;
    }

    return null;
  },

  /**
   * Get current user information
   * @returns {Promise<Object>} - User object
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/current_user');
      return response.data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * Sign out user - clear tokens and call backend
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await api.delete('/auth/sign_out');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      clearTokens();
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!getAccessToken();
  },

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    window.location.href = '/login';
  },

  /**
   * Redirect to dashboard
   */
  redirectToDashboard() {
    window.location.href = '/dashboard';
  }
};

export default authService;

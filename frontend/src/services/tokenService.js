// Token Service for managing JWT tokens
// Access token is stored in localStorage
// Refresh token is stored in httpOnly cookie (managed by backend)

const ACCESS_TOKEN_KEY = 'access_token';

/**
 * Get the access token from local storage
 * @returns {string|null} The access token or null if not found
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Set the access token in local storage
 * @param {string} token - The access token to store
 */
export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Set both access and refresh tokens
 * Note: refresh token is managed by backend as httpOnly cookie
 * @param {string} accessToken - The access token to store
 * @param {string} _refreshToken - Unused, kept for API compatibility
 */
export const setTokens = (accessToken, _refreshToken) => {
  setAccessToken(accessToken);
  // Refresh token is httpOnly cookie, managed by backend
};

/**
 * Clear all tokens from local storage
 * Note: httpOnly refresh token cookie is cleared by backend on sign_out
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Check if the user is authenticated (has an access token)
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

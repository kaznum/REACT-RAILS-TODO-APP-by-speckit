import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the useAuth hook
jest.mock('./hooks/useAuth', () => ({
  ...jest.requireActual('./hooks/useAuth'),
  useAuth: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock authService
jest.mock('./services/authService', () => ({
  isAuthenticated: jest.fn(() => false),
  getCurrentUser: jest.fn(),
  getGoogleAuthUrl: jest.fn(() => 'http://localhost:3000/api/v1/auth/google'),
}));

test('renders login page when not authenticated', () => {
  render(<App />);
  const headingElement = screen.getByText(/TODOマネージャー/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders google login button', () => {
  render(<App />);
  const loginButton = screen.getByText(/Googleでログイン/i);
  expect(loginButton).toBeInTheDocument();
});

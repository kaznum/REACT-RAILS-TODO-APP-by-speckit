import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const headingElement = screen.getByText(/React Rails Todo App/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders getting started section', () => {
  render(<App />);
  const gettingStartedElement = screen.getByText(/Getting Started/i);
  expect(gettingStartedElement).toBeInTheDocument();
});

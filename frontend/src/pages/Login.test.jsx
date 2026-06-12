import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Login from './Login';
import { AuthContext } from '../context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

describe('Login Component', () => {
  it('renders the login form correctly', () => {
    const mockContext = {
      login: () => Promise.resolve(),
    };

    render(
      <HelmetProvider>
        <AuthContext.Provider value={mockContext}>
          <Login setCurrentPage={() => {}} addToast={() => {}} />
        </AuthContext.Provider>
      </HelmetProvider>
    );

    expect(screen.getByText('Welcome Back')).toBeDefined();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeDefined();
  });
});

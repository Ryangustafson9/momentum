// 🧪 AUTH QUERY TESTS - Test unified authentication system
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { createTestQueryClient, createMockSupabaseClient } from '@/test/testUtils';

// Mock Supabase
const mockSupabase = createMockSupabaseClient();
vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Mock access control utilities
vi.mock('@/utils/accessControl', () => ({
  validateUserRole: vi.fn((user) => ({ role: user?.role || 'nonmember' })),
  normalizeRole: vi.fn((role) => role || 'nonmember'),
}));

describe('useAuthQuery', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Session Management', () => {
    it('should return loading state initially', () => {
      const { result } = renderHook(() => useAuthQuery(), { wrapper });
      
      expect(result.current.loading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
    });

    it('should handle successful session retrieval', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle session error', async () => {
      const mockError = new Error('Session error');
      mockSupabase.auth.getSession.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sessionError).toBeTruthy();
    });
  });

  describe('User Profile Management', () => {
    it('should fetch user profile when session exists', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toMatchObject({
        ...mockProfile,
        name: 'John Doe',
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle missing user profile gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Profile not found' },
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Authentication Actions', () => {
    it('should handle login successfully', async () => {
      const mockLoginData = {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token-123' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: mockLoginData,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const loginResult = await result.current.login('test@example.com', 'password');
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(loginResult).toEqual(mockLoginData);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.logout();
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle signup successfully', async () => {
      const mockSignupData = {
        user: { id: 'user-123', email: 'test@example.com' },
        session: null,
      };

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: mockSignupData,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signupResult = await result.current.signup('test@example.com', 'password', {
        first_name: 'John',
        last_name: 'Doe',
      });
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      });
      expect(signupResult).toEqual(mockSignupData);
    });
  });

  describe('Role and Permission Checks', () => {
    it('should correctly identify user roles', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'admin@example.com' },
      };

      const mockProfile = {
        id: 'user-123',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userRole).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isStaff).toBe(true);
      expect(result.current.isMember).toBe(true);
    });

    it('should check permissions correctly', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'staff@example.com' },
      };

      const mockProfile = {
        id: 'user-123',
        email: 'staff@example.com',
        role: 'staff',
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasRole('staff')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.hasPermission('staff')).toBe(true);
      expect(result.current.canAccess('members', 'read')).toBe(true);
      expect(result.current.canAccess('settings', 'write')).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    it('should generate correct display name', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getUserDisplayName()).toBe('John Doe');
      expect(result.current.getUserInitials()).toBe('JD');
      expect(result.current.userName).toBe('John Doe');
      expect(result.current.userInitials).toBe('JD');
      expect(result.current.userEmail).toBe('test@example.com');
    });

    it('should handle missing name gracefully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'member',
      };

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useAuthQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getUserDisplayName()).toBe('test');
      expect(result.current.getUserInitials()).toBe('TE');
    });
  });
});

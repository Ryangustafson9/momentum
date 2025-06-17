/**
 * 🧪 USE AUTH QUERY HOOK TESTS
 * Tests for authentication query hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { createTestQueryClient } from '../utils/test-utils'

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }
}

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase
}))

describe('useAuthQuery Hook', () => {
  let queryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('Initial State', () => {
    it('should return initial loading state', () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.authReady).toBe(false)
    })

    it('should handle session retrieval', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { role: 'member' }
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'member'
      })
      expect(result.current.authReady).toBe(true)
    })
  })

  describe('Authentication Methods', () => {
    it('should handle login successfully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { role: 'member' }
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const loginResult = await result.current.login('test@example.com', 'password')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })

      expect(loginResult.success).toBe(true)
      expect(loginResult.error).toBe(null)
    })

    it('should handle login failure', async () => {
      const mockError = { message: 'Invalid credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const loginResult = await result.current.login('test@example.com', 'wrongpassword')

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid credentials')
    })

    it('should handle signup successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'member' }
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const signupResult = await result.current.signup('test@example.com', 'password')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })

      expect(signupResult.success).toBe(true)
      expect(signupResult.error).toBe(null)
    })

    it('should handle logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const logoutResult = await result.current.logout()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(logoutResult.success).toBe(true)
    })
  })

  describe('Auth State Changes', () => {
    it('should set up auth state change listener', () => {
      const mockUnsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { unmount } = renderHook(() => useAuthQuery(), { wrapper })

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should handle auth state change events', async () => {
      let authStateCallback

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate auth state change
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { role: 'member' }
        }
      }

      authStateCallback('SIGNED_IN', mockSession)

      await waitFor(() => {
        expect(result.current.user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          role: 'member'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle session retrieval error', async () => {
      const mockError = { message: 'Session error' }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.authReady).toBe(true) // Should still be ready even with error
    })

    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.authReady).toBe(true)
    })
  })

  describe('User Role Handling', () => {
    it('should extract role from user metadata', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'staff@example.com',
          user_metadata: { role: 'staff' }
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.user?.role).toBe('staff')
      })
    })

    it('should default to member role if no role specified', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          user_metadata: {}
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuthQuery(), { wrapper })

      await waitFor(() => {
        expect(result.current.user?.role).toBe('member')
      })
    })
  })

  describe('Query Invalidation', () => {
    it('should invalidate queries on auth state change', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      let authStateCallback

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      renderHook(() => useAuthQuery(), { wrapper })

      // Simulate auth state change
      authStateCallback('SIGNED_IN', { user: { id: 'user-123' } })

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalled()
      })
    })
  })
})

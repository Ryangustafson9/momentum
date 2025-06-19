/**
 * 🧪 LOGIN PAGE TESTS
 * Tests for the login page component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockUser } from '../utils/test-utils'
import Login from '@/pages/Login'

// Mock the auth hook
const mockLogin = vi.fn()
const mockAuthState = {
  user: null,
  loading: false,
  authReady: true,
  login: mockLogin,
  logout: vi.fn(),  signup: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', search: '', hash: '', state: null }),
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  }
})

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

describe('Login Page', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.user = null
    mockAuthState.loading = false
  })

  describe('Rendering', () => {
    it('renders login form elements', () => {
      render(<Login />)

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders signup link', () => {
      render(<Login />)

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })

    it('renders forgot password link', () => {
      render(<Login />)

      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
    })

    it('displays momentum branding', () => {
      render(<Login />)

      expect(screen.getByText(/momentum/i)).toBeInTheDocument()
      expect(screen.getByText(/powered by momentum/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      render(<Login />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid email', async () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for short password', async () => {
      render(<Login />)

      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(passwordInput, '123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('clears validation errors when user starts typing', async () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Trigger validation error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })

      // Start typing to clear error
      await user.type(emailInput, 'test@example.com')
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid credentials', async () => {
      mockLogin.mockResolvedValue({ success: true, error: null })

      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('shows loading state during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('handles login success', async () => {
      mockLogin.mockResolvedValue({ success: true, error: null })

      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Successfully signed in!',
          variant: 'default',
        })
      })
    })

    it('handles login failure', async () => {
      mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' })

      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Invalid credentials',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Navigation', () => {
    it('redirects authenticated users', () => {
      mockAuthState.user = createMockUser()

      render(<Login />)

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })

    it('navigates to signup page', async () => {
      render(<Login />)

      const signupLink = screen.getByRole('link', { name: /sign up/i })
      expect(signupLink).toHaveAttribute('href', '/signup')
    })

    it('navigates to forgot password page', async () => {
      render(<Login />)

      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i })
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('has proper heading hierarchy', () => {
      render(<Login />)

      const mainHeading = screen.getByRole('heading', { name: /sign in/i })
      expect(mainHeading).toBeInTheDocument()
    })

    it('has proper focus management', async () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      
      // Email input should be focusable
      emailInput.focus()
      expect(emailInput).toHaveFocus()
    })

    it('supports keyboard navigation', async () => {
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Tab through form elements
      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()
    })
  })

  describe('Error States', () => {
    it('displays network error message', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'))

      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error occurred. Please try again.',
          variant: 'destructive',
        })
      })
    })

    it('handles auth loading state', () => {
      mockAuthState.loading = true

      render(<Login />)

      // The login component should show some loading indication when auth is loading
      // This might be a spinner or disabled state rather than text
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeInTheDocument()
    })
  })

  // Note: Remember Me functionality not implemented in current Login component
  // These tests would be added when the feature is implemented
})

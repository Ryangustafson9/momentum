/**
 * 🧪 MEMBER DASHBOARD INTEGRATION TESTS
 * End-to-end tests for member dashboard functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  render, 
  createMockUser, 
  createMockMember, 
  createMockMembershipType,
  createMockClass,
  mockSupabaseResponse 
} from '../utils/test-utils'
import MemberDashboard from '@/pages/member-portal/MemberDashboard'

// Mock data
const mockMemberUser = createMockUser({ role: 'member' })
const mockMemberData = createMockMember()
const mockMembershipType = createMockMembershipType()
const mockClasses = [
  createMockClass({ name: 'Morning Yoga', start_time: '2024-01-15T09:00:00Z' }),
  createMockClass({ name: 'Evening Pilates', start_time: '2024-01-15T18:00:00Z' }),
]

// Mock hooks
const mockAuthState = {
  user: mockMemberUser,
  loading: false,
  authReady: true,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
}

vi.mock('@/hooks/useAuthQuery', () => ({
  useAuthQuery: () => mockAuthState
}))

// Mock React Query hooks
const mockMemberQuery = {
  data: mockMemberData,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}

const mockMembershipQuery = {
  data: mockMembershipType,
  isLoading: false,
  isError: false,
  error: null,
}

const mockClassesQuery = {
  data: mockClasses,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}

const mockBookClassMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  isError: false,
  error: null,
}

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn((options) => {
      if (options.queryKey[0] === 'member') return mockMemberQuery
      if (options.queryKey[0] === 'membershipType') return mockMembershipQuery
      if (options.queryKey[0] === 'classes') return mockClassesQuery
      return { data: null, isLoading: false, isError: false }
    }),
    useMutation: vi.fn(() => mockBookClassMutation),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
    })),
  }
})

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/member/dashboard' }),
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  }
})

describe('Member Dashboard Integration', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Loading and Display', () => {
    it('displays member information correctly', async () => {
      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText(mockMemberData.name)).toBeInTheDocument()
        expect(screen.getByText(mockMemberData.email)).toBeInTheDocument()
      })

      // Check membership information
      expect(screen.getByText(mockMembershipType.name)).toBeInTheDocument()
      expect(screen.getByText(`$${mockMembershipType.price}`)).toBeInTheDocument()
    })

    it('displays upcoming classes', async () => {
      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument()
        expect(screen.getByText('Evening Pilates')).toBeInTheDocument()
      })
    })

    it('shows loading state initially', () => {
      mockMemberQuery.isLoading = true

      render(<MemberDashboard />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('handles error states gracefully', async () => {
      mockMemberQuery.isError = true
      mockMemberQuery.error = { message: 'Failed to load member data' }

      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument()
      })
    })
  })

  describe('Class Booking Flow', () => {
    beforeEach(() => {
      mockMemberQuery.isLoading = false
      mockMemberQuery.isError = false
      mockClassesQuery.isLoading = false
      mockClassesQuery.isError = false
    })

    it('allows member to book a class', async () => {
      mockBookClassMutation.mutateAsync.mockResolvedValue({ success: true })

      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument()
      })

      // Find and click book button for Morning Yoga
      const yogaClass = screen.getByText('Morning Yoga').closest('[data-testid="class-card"]')
      const bookButton = within(yogaClass).getByRole('button', { name: /book/i })
      
      await user.click(bookButton)

      // Confirm booking in modal
      const confirmButton = screen.getByRole('button', { name: /confirm booking/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockBookClassMutation.mutateAsync).toHaveBeenCalledWith({
          classId: mockClasses[0].id,
          memberId: mockMemberData.id,
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Class booked successfully!',
        variant: 'default',
      })
    })

    it('handles booking failure', async () => {
      mockBookClassMutation.mutateAsync.mockRejectedValue(new Error('Class is full'))

      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument()
      })

      const yogaClass = screen.getByText('Morning Yoga').closest('[data-testid="class-card"]')
      const bookButton = within(yogaClass).getByRole('button', { name: /book/i })
      
      await user.click(bookButton)

      const confirmButton = screen.getByRole('button', { name: /confirm booking/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Class is full',
          variant: 'destructive',
        })
      })
    })

    it('shows booking loading state', async () => {
      mockBookClassMutation.isLoading = true

      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga')).toBeInTheDocument()
      })

      const yogaClass = screen.getByText('Morning Yoga').closest('[data-testid="class-card"]')
      const bookButton = within(yogaClass).getByRole('button', { name: /book/i })
      
      await user.click(bookButton)

      expect(screen.getByText(/booking/i)).toBeInTheDocument()
    })
  })

  describe('Profile Management', () => {
    it('allows member to view profile details', async () => {
      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText(mockMemberData.name)).toBeInTheDocument()
      })

      const profileButton = screen.getByRole('button', { name: /view profile/i })
      await user.click(profileButton)

      expect(screen.getByText(mockMemberData.phone)).toBeInTheDocument()
      expect(screen.getByText(mockMemberData.emergency_contact_name)).toBeInTheDocument()
    })

    it('navigates to profile edit page', async () => {
      render(<MemberDashboard />)

      const editProfileButton = screen.getByRole('button', { name: /edit profile/i })
      await user.click(editProfileButton)

      expect(mockNavigate).toHaveBeenCalledWith('/member/profile')
    })
  })

  describe('Membership Management', () => {
    it('displays current membership details', async () => {
      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText(mockMembershipType.name)).toBeInTheDocument()
        expect(screen.getByText(`$${mockMembershipType.price}`)).toBeInTheDocument()
        expect(screen.getByText(mockMembershipType.billing_type)).toBeInTheDocument()
      })
    })

    it('allows member to upgrade membership', async () => {
      render(<MemberDashboard />)

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i })
      await user.click(upgradeButton)

      expect(mockNavigate).toHaveBeenCalledWith('/member/upgrade')
    })

    it('shows membership status', async () => {
      render(<MemberDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument()
      })
    })
  })

  describe('Quick Actions', () => {
    it('provides quick access to common actions', async () => {
      render(<MemberDashboard />)

      expect(screen.getByRole('button', { name: /book class/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view schedule/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /billing/i })).toBeInTheDocument()
    })

    it('navigates to class schedule', async () => {
      render(<MemberDashboard />)

      const scheduleButton = screen.getByRole('button', { name: /view schedule/i })
      await user.click(scheduleButton)

      expect(mockNavigate).toHaveBeenCalledWith('/member/classes')
    })

    it('navigates to billing page', async () => {
      render(<MemberDashboard />)

      const billingButton = screen.getByRole('button', { name: /billing/i })
      await user.click(billingButton)

      expect(mockNavigate).toHaveBeenCalledWith('/member/billing')
    })
  })

  describe('Data Refresh', () => {
    it('allows manual data refresh', async () => {
      render(<MemberDashboard />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(mockMemberQuery.refetch).toHaveBeenCalled()
      expect(mockClassesQuery.refetch).toHaveBeenCalled()
    })

    it('shows refresh loading state', async () => {
      mockMemberQuery.isRefetching = true

      render(<MemberDashboard />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<MemberDashboard />)

      // Check for mobile-specific classes or layout
      const dashboard = screen.getByTestId('member-dashboard')
      expect(dashboard).toHaveClass('mobile-layout')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<MemberDashboard />)

      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings.length).toBeGreaterThan(0)
    })

    it('supports keyboard navigation', async () => {
      render(<MemberDashboard />)

      // Tab through interactive elements
      await user.tab()
      expect(document.activeElement).toHaveAttribute('role', 'button')
    })

    it('has proper ARIA labels', async () => {
      render(<MemberDashboard />)

      const classCards = screen.getAllByRole('article')
      classCards.forEach(card => {
        expect(card).toHaveAttribute('aria-label')
      })
    })
  })
})

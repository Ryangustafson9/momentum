/**
 * 🧪 TEST UTILITIES
 * Custom render functions and test helpers
 */

import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// ==================== CUSTOM RENDER FUNCTIONS ====================

/**
 * Custom render function with all providers
 */
export function render(ui, options = {}) {
  const {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Render with authentication context
 */
export function renderWithAuth(ui, options = {}) {
  const { user = global.testUtils.mockUser, ...renderOptions } = options

  // Mock auth context
  const MockAuthProvider = ({ children }) => {
    const authValue = {
      user,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    }

    return (
      <div data-testid="mock-auth-provider">
        {children}
      </div>
    )
  }

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={createTestQueryClient()}>
          <MockAuthProvider>
            {children}
          </MockAuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Render with router at specific route
 */
export function renderWithRouter(ui, options = {}) {
  const { route = '/', ...renderOptions } = options

  window.history.pushState({}, 'Test page', route)

  return render(ui, renderOptions)
}

// ==================== QUERY CLIENT UTILITIES ====================

/**
 * Create a test query client with default configuration
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  })
}

// ==================== MOCK DATA GENERATORS ====================

/**
 * Generate mock user data
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'member',
    name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock member data
 */
export function createMockMember(overrides = {}) {
  return {
    id: 'member-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0123',
    date_of_birth: '1990-01-01',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0124',
    membership_type: 'basic',
    status: 'active',
    join_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock staff data
 */
export function createMockStaff(overrides = {}) {
  return {
    id: 'staff-123',
    name: 'Staff Member',
    email: 'staff@example.com',
    role: 'staff',
    permissions: ['read_members', 'write_members'],
    hire_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock membership type data
 */
export function createMockMembershipType(overrides = {}) {
  return {
    id: 'membership-123',
    name: 'Basic Membership',
    description: 'Basic gym access',
    price: 29.99,
    billing_type: 'monthly',
    duration_months: 1,
    features: ['Gym Access', 'Locker Room'],
    category: 'Membership',
    color: '#3b82f6',
    available_for_sale: true,
    available_online: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock class data
 */
export function createMockClass(overrides = {}) {
  return {
    id: 'class-123',
    name: 'Yoga Class',
    description: 'Relaxing yoga session',
    instructor_id: 'instructor-123',
    instructor_name: 'Yoga Instructor',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    capacity: 20,
    enrolled_count: 5,
    room: 'Studio A',
    equipment_needed: ['Yoga Mats'],
    price: 15.00,
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ==================== TEST HELPERS ====================

/**
 * Wait for element to be removed from DOM
 */
export async function waitForElementToBeRemoved(element) {
  const { waitForElementToBeRemoved: rtlWaitForElementToBeRemoved } = await import('@testing-library/react')
  return rtlWaitForElementToBeRemoved(element)
}

/**
 * Wait for loading to finish
 */
export async function waitForLoadingToFinish() {
  const { waitFor, screen } = await import('@testing-library/react')
  
  await waitFor(() => {
    const loadingElements = screen.queryAllByText(/loading/i)
    const spinners = screen.queryAllByRole('status')
    
    expect(loadingElements).toHaveLength(0)
    expect(spinners).toHaveLength(0)
  })
}

/**
 * Mock API response
 */
export function mockApiResponse(data, error = null) {
  return {
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }
}

/**
 * Mock Supabase query response
 */
export function mockSupabaseResponse(data, error = null) {
  return Promise.resolve({
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  })
}

/**
 * Create mock event
 */
export function createMockEvent(type = 'click', properties = {}) {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: { value: '' },
    currentTarget: { value: '' },
    ...properties,
  }
}

/**
 * Mock file for file upload tests
 */
export function createMockFile(name = 'test.jpg', type = 'image/jpeg', size = 1024) {
  return new File(['test content'], name, { type, size })
}

// ==================== ASSERTION HELPERS ====================

/**
 * Assert element has loading state
 */
export function expectLoading(container) {
  const { screen } = require('@testing-library/react')
  
  expect(
    screen.getByText(/loading/i) || 
    screen.getByRole('status') ||
    container.querySelector('[data-testid*="loading"]')
  ).toBeInTheDocument()
}

/**
 * Assert element has error state
 */
export function expectError(message) {
  const { screen } = require('@testing-library/react')
  
  expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument()
}

/**
 * Assert form validation error
 */
export function expectValidationError(fieldName, message) {
  const { screen } = require('@testing-library/react')
  
  const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
  expect(field).toBeInvalid()
  
  if (message) {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument()
  }
}

// ==================== EXPORTS ====================

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export custom utilities as default
export default {
  render,
  renderWithAuth,
  renderWithRouter,
  createTestQueryClient,
  createMockUser,
  createMockMember,
  createMockStaff,
  createMockMembershipType,
  createMockClass,
  waitForLoadingToFinish,
  mockApiResponse,
  mockSupabaseResponse,
  createMockEvent,
  createMockFile,
  expectLoading,
  expectError,
  expectValidationError,
}

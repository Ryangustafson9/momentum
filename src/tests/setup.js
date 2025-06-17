/**
 * 🧪 TEST SETUP CONFIGURATION
 * Global test setup for Vitest and React Testing Library
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'

// ==================== GLOBAL TEST SETUP ====================

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// ==================== MOCK IMPLEMENTATIONS ====================

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// ==================== SUPABASE MOCKS ====================

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    channel: vi.fn(() => ({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      on: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
  getRealtimeStatus: vi.fn(() => 'CONNECTED'),
}))

// ==================== REACT QUERY MOCKS ====================

// Mock React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
      reset: vi.fn(),
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      removeQueries: vi.fn(),
    })),
  }
})

// ==================== ROUTER MOCKS ====================

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  }
})

// ==================== FRAMER MOTION MOCKS ====================

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    label: 'label',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    p: 'p',
    a: 'a',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    img: 'img',
    svg: 'svg',
    path: 'path',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
  useTransform: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}))

// ==================== TOAST MOCKS ====================

// Mock toast notifications
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  })),
}))

// ==================== ENVIRONMENT SETUP ====================

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.VITE_SUPABASE_URL = 'http://localhost:54321'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// ==================== GLOBAL TEST UTILITIES ====================

// Global test utilities
global.testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'member',
    name: 'Test User',
  },
  
  // Mock member data
  mockMember: {
    id: 'test-member-id',
    name: 'Test Member',
    email: 'member@example.com',
    phone: '555-0123',
    membership_type: 'basic',
    status: 'active',
  },
  
  // Mock staff data
  mockStaff: {
    id: 'test-staff-id',
    name: 'Test Staff',
    email: 'staff@example.com',
    role: 'staff',
    permissions: ['read_members', 'write_members'],
  },
}

// Console suppression for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

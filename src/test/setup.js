// 🧪 TEST SETUP - Global test configuration and utilities
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// ⭐ GLOBAL TEST SETUP
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    // Uncomment to silence console logs in tests
    // log: vi.fn(),
    // debug: vi.fn(),
    // info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  // Mock window.matchMedia
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
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();
});

// ⭐ CLEANUP AFTER EACH TEST
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// ⭐ GLOBAL TEARDOWN
afterAll(() => {
  vi.restoreAllMocks();
});

// ⭐ CUSTOM MATCHERS
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received && document.body.contains(received);
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
});

// ⭐ GLOBAL TEST UTILITIES
global.testUtils = {
  // Wait for async operations
  waitFor: (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = callback();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 10);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 10);
          }
        }
      };
      check();
    });
  },

  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'member',
    status: 'active',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Create mock class
  createMockClass: (overrides = {}) => ({
    id: 'test-class-id',
    name: 'Test Class',
    description: 'A test fitness class',
    instructor_id: 'test-instructor-id',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    capacity: 20,
    enrolled_count: 5,
    status: 'active',
    ...overrides,
  }),

  // Create mock membership
  createMockMembership: (overrides = {}) => ({
    id: 'test-membership-id',
    name: 'Test Membership',
    price: 99.99,
    category: 'Member Plans',
    duration_months: 1,
    available_for_sale: true,
    available_online: true,
    ...overrides,
  }),

  // Mock API response
  mockApiResponse: (data, error = null) => ({
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }),
};

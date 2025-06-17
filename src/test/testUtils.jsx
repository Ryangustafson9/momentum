// 🧪 TEST UTILITIES - React Testing Library utilities and custom renders
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// ⭐ CUSTOM RENDER FUNCTION
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// ⭐ CREATE TEST QUERY CLIENT
export const createTestQueryClient = () => {
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
  });
};

// ⭐ MOCK SUPABASE CLIENT
export const createMockSupabaseClient = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
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
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    csv: vi.fn().mockResolvedValue({ data: '', error: null }),
    geojson: vi.fn().mockResolvedValue({ data: null, error: null }),
    explain: vi.fn().mockResolvedValue({ data: null, error: null }),
    rollback: vi.fn().mockResolvedValue({ data: null, error: null }),
    returns: vi.fn().mockReturnThis(),
  };

  // Make the query chainable by returning itself for most methods
  Object.keys(mockQuery).forEach(key => {
    if (typeof mockQuery[key] === 'function' && !['single', 'maybeSingle', 'csv', 'geojson', 'explain', 'rollback'].includes(key)) {
      mockQuery[key].mockReturnValue(mockQuery);
    }
  });

  return {
    from: vi.fn(() => mockQuery),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      }),
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signUp: vi.fn().mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/file.jpg' } 
        }),
      })),
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      })),
    },
  };
};

// ⭐ MOCK REACT QUERY HOOKS
export const createMockQueryHook = (data, isLoading = false, error = null) => {
  return vi.fn(() => ({
    data,
    isLoading,
    error,
    isError: !!error,
    isSuccess: !isLoading && !error,
    refetch: vi.fn(),
    fetchStatus: isLoading ? 'fetching' : 'idle',
    status: isLoading ? 'loading' : error ? 'error' : 'success',
  }));
};

export const createMockMutationHook = (isLoading = false, error = null) => {
  return vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isLoading,
    isPending: isLoading,
    error,
    isError: !!error,
    isSuccess: !isLoading && !error,
    reset: vi.fn(),
    status: isLoading ? 'loading' : error ? 'error' : 'idle',
  }));
};

// ⭐ COMMON TEST DATA
export const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@momentum.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    status: 'active',
  },
  staff: {
    id: 'staff-1',
    email: 'staff@momentum.com',
    first_name: 'Staff',
    last_name: 'Member',
    role: 'staff',
    status: 'active',
  },
  member: {
    id: 'member-1',
    email: 'member@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'member',
    status: 'active',
  },
  nonmember: {
    id: 'nonmember-1',
    email: 'guest@example.com',
    first_name: 'Guest',
    last_name: 'User',
    role: 'nonmember',
    status: 'active',
  },
};

export const mockClasses = [
  {
    id: 'class-1',
    name: 'Morning Yoga',
    description: 'Relaxing yoga session',
    instructor_id: 'instructor-1',
    start_time: '2024-01-15T09:00:00Z',
    end_time: '2024-01-15T10:00:00Z',
    capacity: 20,
    enrolled_count: 15,
    status: 'active',
  },
  {
    id: 'class-2',
    name: 'HIIT Training',
    description: 'High intensity interval training',
    instructor_id: 'instructor-2',
    start_time: '2024-01-15T18:00:00Z',
    end_time: '2024-01-15T19:00:00Z',
    capacity: 15,
    enrolled_count: 12,
    status: 'active',
  },
];

export const mockMemberships = [
  {
    id: 'membership-1',
    name: 'Basic Membership',
    price: 49.99,
    category: 'Member Plans',
    duration_months: 1,
    available_for_sale: true,
    available_online: true,
  },
  {
    id: 'membership-2',
    name: 'Premium Membership',
    price: 89.99,
    category: 'Member Plans',
    duration_months: 1,
    available_for_sale: true,
    available_online: true,
  },
];

// ⭐ ASSERTION HELPERS
export const expectElementToBeVisible = (element) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element, text) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

export const expectButtonToBeEnabled = (button) => {
  expect(button).toBeInTheDocument();
  expect(button).toBeEnabled();
};

export const expectButtonToBeDisabled = (button) => {
  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
};

// ⭐ INTERACTION HELPERS
export const clickButton = async (user, buttonText) => {
  const button = screen.getByRole('button', { name: buttonText });
  await user.click(button);
  return button;
};

export const fillInput = async (user, labelText, value) => {
  const input = screen.getByLabelText(labelText);
  await user.clear(input);
  await user.type(input, value);
  return input;
};

export const selectOption = async (user, selectLabel, optionText) => {
  const select = screen.getByLabelText(selectLabel);
  await user.click(select);
  const option = screen.getByText(optionText);
  await user.click(option);
  return { select, option };
};

// ⭐ WAIT HELPERS
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const waitForErrorToAppear = async (errorText) => {
  await waitFor(() => {
    expect(screen.getByText(errorText)).toBeInTheDocument();
  });
};

export const waitForSuccessMessage = async (successText) => {
  await waitFor(() => {
    expect(screen.getByText(successText)).toBeInTheDocument();
  });
};

// Re-export everything from testing library for convenience
export * from '@testing-library/react';
export { userEvent };
export { vi } from 'vitest';

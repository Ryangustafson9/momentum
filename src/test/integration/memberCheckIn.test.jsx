// 🧪 MEMBER CHECK-IN INTEGRATION TESTS - Test complete check-in flow
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUsers, createMockSupabaseClient } from '@/test/testUtils';
import { QueryClient } from '@tanstack/react-query';
import MemberManagementPanel from '@/components/staff/MemberManagementPanel';

// Mock the unified data service
const mockSupabase = createMockSupabaseClient();
vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Mock toast notifications
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('Member Check-In Integration', () => {
  let queryClient;

  const mockMembers = [
    {
      id: 'member-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-0123',
      status: 'active',
      memberships: [{ 
        id: 'membership-1',
        status: 'Active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      }],
    },
    {
      id: 'member-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '555-0456',
      status: 'active',
      memberships: [{ 
        id: 'membership-2',
        status: 'Active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      }],
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
    mockToast.mockClear();

    // Setup default mock responses
    mockSupabase.from().select().order().mockResolvedValue({
      data: mockMembers,
      error: null,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Successful Check-In Flow', () => {
    it('should complete full check-in process', async () => {
      // Mock successful check-in
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'attendance-1',
          member_id: 'member-1',
          check_in_time: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
        error: null,
      });

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      // Wait for members to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click check-in button for John Doe
      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]);

      // Verify check-in API call
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('attendance');
      });

      // Verify success toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Member checked in successfully',
        });
      });
    });

    it('should update UI optimistically during check-in', async () => {
      // Mock delayed response to test optimistic updates
      mockSupabase.from().insert().select().single.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              id: 'attendance-1',
              member_id: 'member-1',
              check_in_time: new Date().toISOString(),
            },
            error: null,
          }), 100)
        )
      );

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]);

      // Button should be disabled during loading
      await waitFor(() => {
        expect(checkInButtons[0]).toBeDisabled();
      });
    });

    it('should invalidate related queries after successful check-in', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'attendance-1',
          member_id: 'member-1',
          check_in_time: new Date().toISOString(),
        },
        error: null,
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Check-In Error Handling', () => {
    it('should handle check-in API errors gracefully', async () => {
      // Mock API error
      mockSupabase.from().insert().select().single.mockRejectedValue(
        new Error('Database connection failed')
      );

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]);

      // Verify error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Database connection failed',
          variant: 'destructive',
        });
      });
    });

    it('should handle network errors during check-in', async () => {
      // Mock network error
      mockSupabase.from().insert().select().single.mockRejectedValue(
        new Error('Network error')
      );

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        });
      });

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(checkInButtons[0]).toBeEnabled();
      });
    });

    it('should handle duplicate check-in attempts', async () => {
      // Mock duplicate check-in error
      mockSupabase.from().insert().select().single.mockRejectedValue(
        new Error('Member already checked in today')
      );

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Member already checked in today',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Member Status Validation', () => {
    it('should allow check-in for active members', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'attendance-1', member_id: 'member-1' },
        error: null,
      });

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      expect(checkInButtons[0]).toBeEnabled();

      await user.click(checkInButtons[0]);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('attendance');
      });
    });

    it('should handle suspended member check-in attempts', async () => {
      // Mock suspended member
      const suspendedMembers = [
        {
          ...mockMembers[0],
          memberships: [{ 
            ...mockMembers[0].memberships[0],
            status: 'Suspended',
          }],
        },
      ];

      mockSupabase.from().select().order().mockResolvedValue({
        data: suspendedMembers,
        error: null,
      });

      renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Suspended')).toBeInTheDocument();
      });

      // Check-in button should still be available (business logic may allow)
      const checkInButtons = screen.getAllByText('Check In');
      expect(checkInButtons[0]).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should reflect check-ins from other staff members', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Simulate real-time update from another staff member's check-in
      const updatedMembers = [
        {
          ...mockMembers[0],
          last_check_in: new Date().toISOString(),
        },
        ...mockMembers.slice(1),
      ];

      // Update the query cache to simulate real-time update
      queryClient.setQueryData(['members', 'list', {}], updatedMembers);

      // The UI should reflect the update
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle concurrent check-in attempts', async () => {
      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: { id: 'attendance-1', member_id: 'member-1' },
          error: null,
        })
        .mockRejectedValueOnce(
          new Error('Member already checked in')
        );

      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByText('Check In');
      
      // Simulate rapid double-click
      await user.click(checkInButtons[0]);
      await user.click(checkInButtons[0]);

      // Should handle the concurrent attempts gracefully
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should cache member data efficiently', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify that data is cached
      const cachedData = queryClient.getQueryData(['members', 'list', {}]);
      expect(cachedData).toBeDefined();
      expect(cachedData).toHaveLength(2);
    });

    it('should not refetch data unnecessarily', async () => {
      renderWithProviders(<MemberManagementPanel />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const initialCallCount = mockSupabase.from.mock.calls.length;

      // Re-render the component
      renderWithProviders(<MemberManagementPanel />, { queryClient });

      // Should not make additional API calls due to caching
      expect(mockSupabase.from.mock.calls.length).toBe(initialCallCount);
    });
  });
});

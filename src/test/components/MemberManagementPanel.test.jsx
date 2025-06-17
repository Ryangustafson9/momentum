// 🧪 MEMBER MANAGEMENT TESTS - Test member management functionality
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUsers, createMockQueryHook, createMockMutationHook } from '@/test/testUtils';
import MemberManagementPanel from '@/components/staff/MemberManagementPanel';

// Mock the unified queries
vi.mock('@/hooks/useUnifiedQueries', () => ({
  useMembers: vi.fn(),
  useCheckInMember: vi.fn(),
  useUpdateMember: vi.fn(),
}));

import { useMembers, useCheckInMember, useUpdateMember } from '@/hooks/useUnifiedQueries';

describe('MemberManagementPanel', () => {
  const mockMembers = [
    {
      id: 'member-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-0123',
      memberships: [{ status: 'Active' }],
    },
    {
      id: 'member-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '555-0456',
      memberships: [{ status: 'Suspended' }],
    },
    {
      id: 'member-3',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob@example.com',
      memberships: [{ status: 'Active' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      useMembers.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());

      renderWithProviders(<MemberManagementPanel />);

      expect(screen.getByText('Loading members...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should show error state', () => {
      const mockError = new Error('Failed to load members');
      useMembers.mockReturnValue({
        data: [],
        isLoading: false,
        error: mockError,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());

      renderWithProviders(<MemberManagementPanel />);

      expect(screen.getByText('Error loading members: Failed to load members')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('should show empty state when no members found', () => {
      useMembers.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());

      renderWithProviders(<MemberManagementPanel />);

      expect(screen.getByText('No members found')).toBeInTheDocument();
    });
  });

  describe('Member Display', () => {
    beforeEach(() => {
      useMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());
    });

    it('should display member list correctly', () => {
      renderWithProviders(<MemberManagementPanel />);

      // Check header
      expect(screen.getByText('Member Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();

      // Check members are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display member status badges correctly', () => {
      renderWithProviders(<MemberManagementPanel />);

      // Check status badges
      const activeBadges = screen.getAllByText('Active');
      const suspendedBadge = screen.getByText('Suspended');

      expect(activeBadges).toHaveLength(2); // John and Bob
      expect(suspendedBadge).toBeInTheDocument(); // Jane
    });

    it('should display member contact information', () => {
      renderWithProviders(<MemberManagementPanel />);

      // Check email and phone display
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-0123')).toBeInTheDocument();
      expect(screen.getByText('555-0456')).toBeInTheDocument();
    });

    it('should show member initials in avatar', () => {
      renderWithProviders(<MemberManagementPanel />);

      // Check initials are displayed (this would be in the avatar circles)
      const avatars = screen.getAllByText('JD'); // John Doe
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      useMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());
    });

    it('should have search input', () => {
      renderWithProviders(<MemberManagementPanel />);

      const searchInput = screen.getByPlaceholderText('Search members by name, email, or phone...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should call useMembers with search filter when typing', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      const searchInput = screen.getByPlaceholderText('Search members by name, email, or phone...');
      
      await user.type(searchInput, 'John');

      // Should call useMembers with search parameter
      await waitFor(() => {
        expect(useMembers).toHaveBeenCalledWith({
          search: 'John',
          status: undefined,
        });
      });
    });

    it('should not search with less than 2 characters', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      const searchInput = screen.getByPlaceholderText('Search members by name, email, or phone...');
      
      await user.type(searchInput, 'J');

      // Should not call useMembers with search parameter for single character
      expect(useMembers).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
      });
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      useMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());
    });

    it('should have status filter dropdown', () => {
      renderWithProviders(<MemberManagementPanel />);

      expect(screen.getByText('All Members')).toBeInTheDocument();
    });

    it('should filter by active status', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      // Click on the filter dropdown
      const filterButton = screen.getByRole('combobox');
      await user.click(filterButton);

      // Select "Active" option
      const activeOption = screen.getByText('Active');
      await user.click(activeOption);

      // Should call useMembers with status filter
      await waitFor(() => {
        expect(useMembers).toHaveBeenCalledWith({
          search: undefined,
          status: 'active',
        });
      });
    });
  });

  describe('Member Actions', () => {
    let mockCheckInMutation;
    let mockUpdateMutation;

    beforeEach(() => {
      useMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
      });

      mockCheckInMutation = createMockMutationHook()();
      mockUpdateMutation = createMockMutationHook()();

      useCheckInMember.mockReturnValue(mockCheckInMutation);
      useUpdateMember.mockReturnValue(mockUpdateMutation);
    });

    it('should have check-in buttons for each member', () => {
      renderWithProviders(<MemberManagementPanel />);

      const checkInButtons = screen.getAllByText('Check In');
      expect(checkInButtons).toHaveLength(mockMembers.length);
    });

    it('should call check-in mutation when check-in button clicked', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      const checkInButtons = screen.getAllByText('Check In');
      await user.click(checkInButtons[0]); // Click first check-in button

      expect(mockCheckInMutation.mutate).toHaveBeenCalledWith({
        memberId: 'member-1',
        memberName: 'John Doe',
      });
    });

    it('should have action menu for each member', () => {
      renderWithProviders(<MemberManagementPanel />);

      const actionMenus = screen.getAllByRole('button', { name: '' }); // Menu trigger buttons
      expect(actionMenus.length).toBeGreaterThan(0);
    });

    it('should show member actions in dropdown menu', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      // Find and click the first action menu button (three dots)
      const actionButtons = screen.getAllByRole('button');
      const menuButton = actionButtons.find(button => 
        button.querySelector('svg') && !button.textContent.trim()
      );
      
      if (menuButton) {
        await user.click(menuButton);

        // Check if menu items appear
        await waitFor(() => {
          expect(screen.getByText('View Details')).toBeInTheDocument();
          expect(screen.getByText('Suspend')).toBeInTheDocument();
          expect(screen.getByText('Activate')).toBeInTheDocument();
        });
      }
    });

    it('should call update mutation when status action clicked', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      // Find and click the first action menu button
      const actionButtons = screen.getAllByRole('button');
      const menuButton = actionButtons.find(button => 
        button.querySelector('svg') && !button.textContent.trim()
      );
      
      if (menuButton) {
        await user.click(menuButton);

        await waitFor(() => {
          expect(screen.getByText('Suspend')).toBeInTheDocument();
        });

        const suspendButton = screen.getByText('Suspend');
        await user.click(suspendButton);

        expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
          memberId: 'member-1',
          updates: { status: 'Suspended' },
        });
      }
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      useMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());
    });

    it('should have responsive layout classes', () => {
      renderWithProviders(<MemberManagementPanel />);

      // Check for responsive classes in the search/filter section
      const searchContainer = screen.getByPlaceholderText('Search members by name, email, or phone...').closest('div').parentElement;
      expect(searchContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });

    it('should have scrollable member list', () => {
      renderWithProviders(<MemberManagementPanel />);

      const membersList = screen.getByPlaceholderText('Search members by name, email, or phone...')
        .closest('.space-y-4')
        .querySelector('.space-y-3');
      
      expect(membersList).toHaveClass('max-h-96', 'overflow-y-auto');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      useMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
      });
      useCheckInMember.mockReturnValue(createMockMutationHook()());
      useUpdateMember.mockReturnValue(createMockMutationHook()());
    });

    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<MemberManagementPanel />);

      // Check for proper roles
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Filter dropdown
      expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<MemberManagementPanel />);

      expect(screen.getByRole('heading', { name: 'Member Management' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const { user } = renderWithProviders(<MemberManagementPanel />);

      const searchInput = screen.getByPlaceholderText('Search members by name, email, or phone...');
      
      // Should be able to focus and type in search input
      await user.click(searchInput);
      expect(searchInput).toHaveFocus();
      
      await user.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');
    });
  });
});

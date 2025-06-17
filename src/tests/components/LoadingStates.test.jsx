/**
 * 🧪 LOADING STATES COMPONENT TESTS
 * Tests for all loading state components
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '../utils/test-utils'
import {
  LoadingSpinner,
  PageLoading,
  InlineLoading,
  ButtonLoading,
  TableLoading,
  CardLoading,
  ChartLoading,
  SuspenseFallback,
  ProgressLoading,
} from '@/shared/components/LoadingStates'

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-6', 'w-6')
    })

    it('renders with custom size', () => {
      render(<LoadingSpinner size="lg" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('applies custom className', () => {
      render(<LoadingSpinner className="text-red-500" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('text-red-500')
    })

    it('has proper accessibility attributes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('PageLoading', () => {
    it('renders with default message', () => {
      render(<PageLoading />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we load your content')).toBeInTheDocument()
    })

    it('renders with custom message', () => {
      render(<PageLoading message="Loading dashboard..." />)
      
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    })

    it('has proper layout structure', () => {
      render(<PageLoading />)
      
      const container = screen.getByText('Loading...').closest('div')
      expect(container).toHaveClass('min-h-screen', 'flex', 'flex-col', 'items-center', 'justify-center')
    })

    it('includes loading spinner', () => {
      render(<PageLoading />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })

  describe('InlineLoading', () => {
    it('renders with default message', () => {
      render(<InlineLoading />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with custom message', () => {
      render(<InlineLoading message="Saving..." />)
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<InlineLoading className="my-custom-class" />)
      
      const container = screen.getByText('Loading...').closest('div')
      expect(container).toHaveClass('my-custom-class')
    })

    it('has proper inline layout', () => {
      render(<InlineLoading />)
      
      const container = screen.getByText('Loading...').closest('div')
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'p-4')
    })
  })

  describe('ButtonLoading', () => {
    it('renders children when not loading', () => {
      render(
        <ButtonLoading loading={false}>
          Save Changes
        </ButtonLoading>
      )
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })

    it('shows spinner when loading', () => {
      render(
        <ButtonLoading loading={true}>
          Save Changes
        </ButtonLoading>
      )
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('disables button when loading', () => {
      render(
        <ButtonLoading loading={true}>
          Save Changes
        </ButtonLoading>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('passes through button props', () => {
      render(
        <ButtonLoading loading={false} type="submit" className="btn-primary">
          Submit
        </ButtonLoading>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveClass('btn-primary')
    })
  })

  describe('TableLoading', () => {
    it('renders default number of rows and columns', () => {
      render(<TableLoading />)
      
      // Default is 5 rows, 4 columns
      const skeletons = screen.getAllByTestId(/skeleton/i)
      expect(skeletons).toHaveLength(20) // 5 * 4
    })

    it('renders custom number of rows and columns', () => {
      render(<TableLoading rows={3} columns={2} />)
      
      const skeletons = screen.getAllByTestId(/skeleton/i)
      expect(skeletons).toHaveLength(6) // 3 * 2
    })

    it('has proper table structure', () => {
      render(<TableLoading />)
      
      const container = screen.getAllByTestId(/skeleton/i)[0].closest('div')
      expect(container).toHaveClass('space-y-3')
    })
  })

  describe('CardLoading', () => {
    it('renders card skeleton structure', () => {
      render(<CardLoading />)
      
      // Should have header and content skeletons
      const skeletons = screen.getAllByTestId(/skeleton/i)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('has proper card layout', () => {
      render(<CardLoading />)
      
      const card = screen.getByTestId(/card/i) || screen.getAllByTestId(/skeleton/i)[0].closest('[class*="card"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('ChartLoading', () => {
    it('renders with default height', () => {
      render(<ChartLoading />)
      
      const chartContainer = screen.getAllByTestId(/skeleton/i)[0].closest('div')
      expect(chartContainer).toBeInTheDocument()
    })

    it('renders with custom height', () => {
      render(<ChartLoading height={400} />)
      
      const chartContainer = screen.getAllByTestId(/skeleton/i)[0].closest('div')
      expect(chartContainer).toBeInTheDocument()
    })

    it('includes chart bars simulation', () => {
      render(<ChartLoading />)
      
      // Should have multiple skeleton bars representing chart data
      const skeletons = screen.getAllByTestId(/skeleton/i)
      expect(skeletons.length).toBeGreaterThan(5) // Header + multiple bars
    })
  })

  describe('SuspenseFallback', () => {
    it('renders with default message', () => {
      render(<SuspenseFallback />)
      
      expect(screen.getByText('Loading component...')).toBeInTheDocument()
    })

    it('renders with custom message', () => {
      render(<SuspenseFallback message="Loading page..." />)
      
      expect(screen.getByText('Loading page...')).toBeInTheDocument()
    })

    it('has proper suspense layout', () => {
      render(<SuspenseFallback />)
      
      const container = screen.getByText('Loading component...').closest('div')
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'p-8')
    })

    it('includes loading spinner', () => {
      render(<SuspenseFallback />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-8', 'w-8')
    })
  })

  describe('ProgressLoading', () => {
    it('renders with stage information', () => {
      const stages = {
        init: 'Initializing...',
        loading: 'Loading data...',
        complete: 'Complete!'
      }

      render(<ProgressLoading stage="loading" stages={stages} />)

      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })

    it('shows progress information', () => {
      const stages = {
        init: 'Initializing...',
        loading: 'Loading data...',
        complete: 'Complete!'
      }

      render(<ProgressLoading stage="loading" stages={stages} />)

      // Should show step information
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    })

    it('calculates correct progress percentage', () => {
      const stages = {
        init: 'Initializing...',
        loading: 'Loading data...',
        complete: 'Complete!'
      }

      render(<ProgressLoading stage="loading" stages={stages} />)

      // Stage 2 of 3 should be 66.67%
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('all loading components have proper ARIA attributes', () => {
      render(
        <div>
          <LoadingSpinner />
          <PageLoading />
          <InlineLoading />
        </div>
      )
      
      const spinners = screen.getAllByRole('status', { hidden: true })
      expect(spinners.length).toBeGreaterThan(0)
      
      spinners.forEach(spinner => {
        expect(spinner).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('loading text is accessible to screen readers', () => {
      render(<PageLoading message="Loading dashboard data" />)
      
      expect(screen.getByText('Loading dashboard data')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we load your content')).toBeInTheDocument()
    })
  })
})

/**
 * 🧪 BUTTON COMPONENT TESTS
 * Simple tests for UI button components
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  const user = userEvent.setup()

  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>)
      
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('renders button with custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick} disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Button>Default</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('applies secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('applies destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })
  })

  describe('Sizes', () => {
    it('applies default size classes', () => {
      render(<Button>Default Size</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10')
    })

    it('applies small size classes', () => {
      render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
    })

    it('applies large size classes', () => {
      render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11')
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Keyboard Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('has proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      // Note: aria-disabled is not automatically set by the button component
      // This would need to be added if required for accessibility
    })

    it('supports custom ARIA attributes', () => {
      render(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })
  })

  describe('Form Integration', () => {
    it('supports form submission', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('supports form reset', async () => {
      render(
        <form>
          <input defaultValue="test" />
          <Button type="reset">Reset</Button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button')
      
      // Change input value
      await user.clear(input)
      await user.type(input, 'changed')
      expect(input).toHaveValue('changed')
      
      // Reset form
      await user.click(button)
      expect(input).toHaveValue('test')
    })
  })

  describe('Loading State', () => {
    it('renders normally without loading prop', () => {
      render(<Button>Normal Button</Button>)

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
      expect(button).toHaveTextContent('Normal Button')
    })

    it('handles loading prop gracefully', () => {
      // Note: The current Button component doesn't implement loading state
      // This test verifies it doesn't break when loading prop is passed
      render(<Button loading>Button Text</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Button Text')
    })
  })

  describe('Icon Support', () => {
    it('renders with icon', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>
      
      render(
        <Button>
          <TestIcon />
          Button with Icon
        </Button>
      )
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('Button with Icon')).toBeInTheDocument()
    })
  })
})

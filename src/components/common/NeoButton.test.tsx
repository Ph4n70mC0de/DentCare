import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeoButton } from '../common/NeoButton';

describe('NeoButton', () => {
  it('renders button with children', () => {
    render(<NeoButton>Click me</NeoButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<NeoButton variant="primary">Primary</NeoButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('neo-btn-primary');
  });

  it('applies size classes', () => {
    render(<NeoButton size="sm">Small</NeoButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3.5');
    expect(button).toHaveClass('py-1.5');
  });

  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<NeoButton onClick={handleClick}>Click me</NeoButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<NeoButton disabled>Disabled</NeoButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders icon when provided', () => {
    render(<NeoButton icon={<span data-testid="icon">★</span>}>With Icon</NeoButton>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
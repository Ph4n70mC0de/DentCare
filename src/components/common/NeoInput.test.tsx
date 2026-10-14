import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeoInput } from '../common/NeoInput';

describe('NeoInput', () => {
  it('renders input with label', () => {
    render(<NeoInput label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
  });

  it('applies value and calls onChange', () => {
    const handleChange = vi.fn();
    render(<NeoInput value="test@example.com" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test@example.com');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('passes required attribute to input when required', () => {
    render(<NeoInput label="Name" required />);
    const input = screen.getByLabelText(/name/i);
    expect(input).toBeRequired();
  });

  it('applies error state', () => {
    render(<NeoInput label="Email" error="Invalid email" />);
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<NeoInput label="Search" icon={<span data-testid="icon">🔍</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
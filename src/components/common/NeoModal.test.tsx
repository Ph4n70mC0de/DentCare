import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NeoModal } from './NeoModal';
import { NeoButton } from './NeoButton';
import { NeoInput } from './NeoInput';

describe('NeoModal', () => {
  it('renders nothing when closed', () => {
    render(<NeoModal isOpen={false} onClose={() => {}} title="Test">content</NeoModal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with title and children when open', () => {
    render(<NeoModal isOpen onClose={() => {}} title="My Modal">Modal body</NeoModal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('sets aria-modal and accessible name', () => {
    render(<NeoModal isOpen onClose={() => {}} title="Accessible Modal">body</NeoModal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Accessible Modal');
  });

  it('has a labelled close button', () => {
    render(<NeoModal isOpen onClose={() => {}} title="Closeable">body</NeoModal>);
    expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const handleClose = vi.fn();
    render(<NeoModal isOpen onClose={handleClose} title="Closeable">body</NeoModal>);
    screen.getByRole('button', { name: /close modal/i }).click();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const handleClose = vi.fn();
    render(<NeoModal isOpen onClose={handleClose} title="Escapable">body</NeoModal>);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('moves focus into the dialog on open', () => {
    render(
      <NeoModal isOpen onClose={() => {}} title="Focusable">
        <NeoInput label="First field" />
        <NeoButton>Submit</NeoButton>
      </NeoModal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('exposes focusable elements that can be tabbed', () => {
    render(
      <NeoModal isOpen onClose={() => {}} title="With Fields">
        <NeoInput label="Email" />
        <NeoButton>Save</NeoButton>
      </NeoModal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelectorAll('input:not([disabled])').length).toBe(1);
    expect(dialog.querySelectorAll('button:not([disabled])').length).toBe(2); // close + save
  });

  it('applies maxWidth class', () => {
    render(<NeoModal isOpen onClose={() => {}} title="Wide" maxWidth="2xl">body</NeoModal>);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');
  });
});
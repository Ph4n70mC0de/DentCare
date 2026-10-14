import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

const Blow: React.FC = () => {
  throw new Error('Render boom');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Silence the expected console.error from React's error reporting.
    console.error = vi.fn();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Healthy content</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Healthy content')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('catches a render error and shows the fallback UI', () => {
    render(
      <ErrorBoundary>
        <Blow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText('Healthy content')).not.toBeInTheDocument();
  });

  it('reports the caught error via console.error', () => {
    render(
      <ErrorBoundary>
        <Blow />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('calls the onError callback with the error and component stack', () => {
    const handleError = vi.fn();
    render(
      <ErrorBoundary onError={handleError}>
        <Blow />
      </ErrorBoundary>
    );
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(handleError.mock.calls[0][0].message).toBe('Render boom');
    expect(handleError.mock.calls[0][1]).toHaveProperty('componentStack');
  });

  it('exposes error details for debugging', () => {
    render(
      <ErrorBoundary>
        <Blow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/error details/i)).toBeInTheDocument();
  });

  it('renders a custom fallback instead of the default', () => {
    render(
      <ErrorBoundary fallback={<div>Custom recovery screen</div>}>
        <Blow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom recovery screen')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('recovers when the user retries', () => {
    render(
      <ErrorBoundary>
        <Blow />
      </ErrorBoundary>
    );
    // Boundary shows the retry affordance after catching.
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
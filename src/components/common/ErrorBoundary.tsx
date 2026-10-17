import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NeoButton } from '../common/NeoButton';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full neo-raised-lg p-8 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full neo-raised mx-auto flex items-center justify-center bg-rose-100 text-rose-600">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
              <p className="text-sm text-slate-600">
                We encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left p-4 rounded-xl neo-inset bg-slate-100/50 space-y-2">
                <summary className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Error Details (click to expand)
                </summary>
                <pre className="text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap font-mono">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <NeoButton
                variant="primary"
                onClick={this.handleRetry}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </NeoButton>
              <NeoButton
                variant="default"
                onClick={() => (window.location.href = '/')}
                icon={<Home className="w-4 h-4" />}
              >
                Go Home
              </NeoButton>
            </div>

            <p className="text-[11px] text-slate-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

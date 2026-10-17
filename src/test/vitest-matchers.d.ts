import '@testing-library/jest-dom';
import { expect } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
declare module 'vitest' {
  interface Assertion<T> {
    toBeInTheDocument(): T;
    toHaveClass(className: string): T;
    toHaveValue(value: string | number): T;
    toBeRequired(): T;
    toBeDisabled(): T;
    toHaveTextContent(text: string | RegExp): T;
    toBeVisible(): T;
    toBeEnabled(): T;
    toHaveAttribute(name: string, value?: string): T;
    toHaveStyle(style: Record<string, string>): T;
    toHaveAccessibleName(name: string | RegExp): T;
    toHaveAccessibleDescription(description: string | RegExp): T;
    toHaveFocus(): T;
    toHaveRole(role: string): T;
    toBeChecked(): T;
    toBeEmptyDOMElement(): T;
  }
}

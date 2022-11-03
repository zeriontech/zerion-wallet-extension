import React from 'react';

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    forceIsErrorForTesting?: boolean;
    renderError: (
      error?: (Error & { code?: number }) | null
    ) => React.ReactNode;
  }>
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError || this.props.forceIsErrorForTesting) {
      return this.props.renderError(this.state.error);
    }
    return this.props.children;
  }
}

import React from 'react';

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    renderError: (rror?: Error | null) => React.ReactNode;
  }>
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.renderError(this.state.error);
    }
    return this.props.children;
  }
}

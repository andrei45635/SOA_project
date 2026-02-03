import React, { Suspense, lazy, ComponentType } from 'react';

interface Props {
  name: string;
  componentProps?: Record<string, unknown>;
}

const Loading = () => (
  <div style={styles.loading}>
    <div style={styles.spinner}></div>
    <p>Loading micro-frontend...</p>
  </div>
);

const ErrorFallback = ({ name }: { name: string }) => (
  <div style={styles.error}>
    <h3>Failed to load {name}</h3>
    <p>The micro-frontend could not be loaded. Please try refreshing the page.</p>
  </div>
);

// Lazy load remote components
const remoteComponents: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {
  orders: lazy(() => import('ordersMfe/Orders')),
  analytics: lazy(() => import('analyticsMfe/Analytics')),
  notifications: lazy(() => import('notificationsMfe/Notifications')),
};

export function MicroFrontendLoader({ name, componentProps = {} }: Props) {
  const Component = remoteComponents[name];

  if (!Component) {
    return <ErrorFallback name={name} />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={<ErrorFallback name={name} />}>
        <Component {...componentProps} />
      </ErrorBoundary>
    </Suspense>
  );
}

// Simple error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Micro-frontend error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#666',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  error: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#fee',
    borderRadius: '8px',
    color: '#c00',
  },
};

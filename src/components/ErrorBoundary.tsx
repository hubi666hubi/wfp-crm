import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[OMEGA ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
          <div className="w-12 h-12 bg-rose-600/20 border border-rose-500/30 rounded-xl flex items-center justify-center mb-4">
            <span className="text-rose-500 font-mono text-xl">!</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Moduł niedostępny</h2>
          <p className="text-neutral-500 text-sm font-mono mb-4 max-w-md">
            {this.state.error?.message?.includes('JSON') || this.state.error?.message?.includes('fetch')
              ? 'Backend API niedostępny w tej wersji. Uruchom serwer lokalnie.'
              : this.state.error?.message ?? 'Nieznany błąd modułu.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600/10 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-mono hover:bg-rose-600/20 transition-colors cursor-pointer"
          >
            Spróbuj ponownie
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

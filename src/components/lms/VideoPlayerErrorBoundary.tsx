import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class VideoPlayerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.group('🚨 [VideoPlayerErrorBoundary] Video Player Render Crash Detected');
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    console.error('React Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleReset = (): void => {
    console.log('[VideoPlayerErrorBoundary] Resetting error boundary state...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-800/80 bg-slate-950 p-6 sm:p-8 text-white space-y-4 my-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-rose-300">
                {this.props.fallbackTitle || 'Video Player Component Error'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected runtime error occurred while mounting or rendering the video stream player.
                Diagnostics have been captured in the browser console.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
              <span className="font-bold text-slate-400">Error: </span>
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Video Player</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

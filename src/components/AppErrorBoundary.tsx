import React from 'react';

interface AppErrorBoundaryState { hasError: boolean; message?: string }

/**
 * Boundary de errores para aislar fallos de UI y servicios (WS, cámara, backend).
 * Recupera el estado mostrando UI amigable y registra localmente.
 * @example
 * <AppErrorBoundary><App /></AppErrorBoundary>
 */
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    window.api?.logError?.({ message: error.message, stack: error.stack, context: 'renderer-error-boundary' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-300">
          <h1 className="text-xl font-semibold mb-2">Algo salió mal</h1>
          <p className="mb-4">La interfaz encontró un problema inesperado. Intenta recargar la ventana.</p>
          {this.state.message && <pre className="text-sm opacity-80">{this.state.message}</pre>}
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}



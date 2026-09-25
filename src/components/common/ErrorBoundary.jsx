import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-900/5 rounded-3xl border border-slate-200 m-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-xl border border-rose-100 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Ocurrió un inconveniente al cargar esta sección
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              La vista solicitada no pudo renderizarse debido a un error temporal de datos. Hemos protegido el sistema para evitar cierres inesperados.
            </p>

            {this.state.error?.message && (
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left w-full text-[11px] font-mono text-slate-700 break-all">
                <span className="font-bold text-rose-600 block mb-0.5">Detalle:</span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 mt-5 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-[#532C8C] hover:bg-[#432172] text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Recargar Página</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

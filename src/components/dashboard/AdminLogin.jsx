import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { loginAdmin } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginAdmin(password)) {
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo de radar decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-teal-400 animate-ping opacity-20" />
        <div className="w-[400px] h-[400px] rounded-full border border-purple-500" />
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Logo Institucional */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#532C8C] to-[#00A896] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 mb-3 border border-white/20">
            <ShieldAlert className="w-8 h-8 text-teal-200" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            CENTRAL DE CONTROL & DESPACHO
          </h2>
          <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest mt-1">
            Escudo Vial • Acceso Restringido 24/7
          </span>
          <p className="text-xs text-slate-400 mt-2">
            Ingreso exclusivo para operadores de monitoreo vial, radiopatrullas y triage de ambulancias.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Contraseña incorrecta. Verifica e intenta nuevamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-teal-400" />
              <span>Contraseña de Operador</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave de acceso..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00A896] to-teal-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-lg shadow-teal-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span>INGRESAR A LA TORRE DE DESPACHO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

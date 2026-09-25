import React from 'react';
import { useApp } from '../context/AppContext';
import MobileApp from '../components/mobile/MobileApp';
import DashboardMain from '../components/dashboard/DashboardMain';
import AdminLogin from '../components/dashboard/AdminLogin';
import { Smartphone, LayoutDashboard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoSplitPage() {
  const { activeSku, isAdminAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Barra de cabecera del modo demo */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-teal-400">ESCUDO VIAL</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 font-semibold">Modo Demostración Dual (Móvil + Panel)</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Abrir Móvil en pestaña separada</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
          <span className="text-slate-700">|</span>
          <Link
            to="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Abrir Panel en pestaña separada</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-screen">
        {/* Lado Izquierdo: Móvil */}
        <div className="xl:col-span-4 bg-slate-900/90 border-r border-slate-800 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto max-h-screen">
          <div className="w-full max-w-sm mb-3 flex items-center justify-between text-xs text-slate-400">
            <span className="font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <Smartphone className="w-4 h-4 text-teal-400" />
              Vista del Conductor
            </span>
            <span className="text-[11px] bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              {activeSku}
            </span>
          </div>

          <div className="w-full max-w-sm rounded-[42px] p-2.5 bg-slate-950 border-4 border-slate-700 shadow-2xl overflow-hidden ring-8 ring-black/40">
            <div className="rounded-[32px] overflow-hidden relative max-h-[820px] overflow-y-auto no-scrollbar">
              <MobileApp />
            </div>
          </div>
        </div>

        {/* Lado Derecho: Panel */}
        <div className="xl:col-span-8 bg-slate-50 overflow-y-auto max-h-screen">
          {isAdminAuthenticated ? <DashboardMain /> : <AdminLogin />}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Clock, 
  Radio, 
  UserCheck, 
  Search,
  BellRing,
  LogOut
} from 'lucide-react';

export default function DashboardHeader({ onSearch, activeTab, setActiveTab }) {
  const { soundEnabled, setSoundEnabled, emergencies, unreadAlert, setUnreadAlert, logoutAdmin, clearAllData } = useApp();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const activeEmergenciesCount = emergencies.filter(e => e.status !== 'resuelto').length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Alerta Banner Superior si hay emergencia crítica */}
      {unreadAlert && unreadAlert.status === 'critico' && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white px-4 py-2 flex items-center justify-between shadow-md animate-beacon">
          <div className="flex items-center gap-3">
            <span className="p-1 rounded-full bg-white/20 animate-spin">
              <Radio className="w-4 h-4 text-white" />
            </span>
            <span className="font-extrabold text-sm tracking-wide">
              ¡NUEVA ALERTA S.O.S ENTRANTE!
            </span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded font-mono font-bold">
              {unreadAlert.folio} • SKU: {unreadAlert.sku}
            </span>
            <span className="text-xs text-white/90 hidden md:inline">
              Titular: {unreadAlert.holderName} ({unreadAlert.phone})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('radar');
                setUnreadAlert(null);
              }}
              className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Atender de Inmediato
            </button>
            <button
              onClick={() => setUnreadAlert(null)}
              className="text-white/80 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Marca y Estado del Sistema */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#532C8C] text-white flex items-center justify-center shadow-md shadow-purple-900/20">
            <ShieldAlert className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                ESCUDO VIAL
              </h1>
              <span className="bg-purple-100 text-[#532C8C] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                CENTRAL DE DESPACHO
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Torre de Monitoreo Activa 24/7
              </span>
              {activeEmergenciesCount > 0 && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  {activeEmergenciesCount} {activeEmergenciesCount === 1 ? 'caso activo' : 'casos activos'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buscador Global y Herramientas */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Buscador */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, Cédula, Placa o Folio..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#532C8C] focus:bg-white transition-all"
            />
          </div>

          {/* Reloj y Fecha en Vivo */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/80 text-slate-700 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-bold text-slate-900">{timeStr}</span>
            <span className="text-slate-300">|</span>
            <span className="capitalize">{dateStr}</span>
          </div>

          {/* Control de Sonido de Sirena */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar sonido de sirena'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-purple-50 text-[#532C8C] border-purple-200 hover:bg-purple-100' 
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Perfil del Operador */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-[#00A896] font-extrabold text-xs flex items-center justify-center border border-teal-200">
              OP
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">Guardia Alpha</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-500" /> En línea
              </span>
            </div>
            <button
              type="button"
              onClick={logoutAdmin}
              title="Cerrar sesión de operador"
              className="p-1.5 ml-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

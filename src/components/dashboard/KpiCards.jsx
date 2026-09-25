import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, 
  QrCode, 
  FileSpreadsheet, 
  Clock, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';

export default function KpiCards({ onCardClick, activeFilter }) {
  const { emergencies, qrList, reports } = useApp();

  const activeEmergencies = emergencies.filter(e => e.status !== 'resuelto');
  const criticalCount = emergencies.filter(e => e.status === 'critico').length;
  const activeQrsCount = qrList.filter(q => q.status === 'active').length;
  const totalReportsCount = reports.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tarjeta 1: Emergencias Activas (Máxima Prioridad Visual) */}
      <div 
        onClick={() => onCardClick('radar')}
        className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-sm relative overflow-hidden group ${
          activeEmergencies.length > 0 
            ? 'bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-600/20 border-rose-500 ring-2 ring-rose-500/40 hover:shadow-lg hover:shadow-rose-500/20 animate-pulse' 
            : activeFilter === 'radar'
              ? 'bg-gradient-to-br from-rose-50 via-white to-red-50/40 border-rose-400 ring-2 ring-rose-400/30 shadow-md'
              : 'bg-gradient-to-br from-rose-50/60 via-white to-red-50/20 border-rose-200 hover:border-rose-400 hover:shadow-md hover:shadow-rose-500/10'
        }`}
      >
        {/* Glow de fondo */}
        <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full blur-xl pointer-events-none ${
          activeEmergencies.length > 0 ? 'bg-rose-500/30 animate-pulse' : 'bg-rose-400/15'
        }`} />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeEmergencies.length > 0 ? 'bg-rose-500' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeEmergencies.length > 0 ? 'bg-rose-600' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-xs font-black text-rose-700 uppercase tracking-wider">
              Emergencias S.O.S
            </span>
          </div>

          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${
            activeEmergencies.length > 0 
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-bounce' 
              : 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-xs'
          }`}>
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-2 relative z-10">
          <span className={`text-3xl font-black tracking-tight ${activeEmergencies.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {activeEmergencies.length}
          </span>
          {activeEmergencies.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-rose-600 px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
              🚨 {activeEmergencies.length} en curso
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              En escucha 24/7
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between font-semibold relative z-10">
          <span>{activeEmergencies.length > 0 ? '¡Despacho y auxilio prioritario!' : 'Sin emergencias pendientes'}</span>
          <span className="text-[10.5px] text-rose-600 font-extrabold group-hover:translate-x-1 transition-transform">Ver Radar ➔</span>
        </p>
      </div>

      {/* Tarjeta 2: QRs Protegidos */}
      <div 
        onClick={() => onCardClick('qrs')}
        className="bg-white rounded-2xl p-4 border border-slate-200 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-[#00A896]/60"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            QRs Protegidos 24/7
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {activeQrsCount}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            / {qrList.length} en sistema
          </span>
        </div>
        <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {Math.round((activeQrsCount / (qrList.length || 1)) * 100)}% de stickers vinculados
        </p>
      </div>

      {/* Tarjeta 3: Reportes de Tránsito */}
      <div 
        onClick={() => onCardClick('reportes')}
        className="bg-white rounded-2xl p-4 border border-slate-200 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-[#532C8C]/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Reportes Viales
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#532C8C] flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {totalReportsCount}
          </span>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            Ciudadanos
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          Imprudencias, choques y alertas en vía
        </p>
      </div>

      {/* Tarjeta 4: Tiempo Promedio de Respuesta */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tiempo de Respuesta
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            2.4 min
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Óptimo
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          Triage telefónico y enlace con patrullas
        </p>
      </div>
    </div>
  );
}

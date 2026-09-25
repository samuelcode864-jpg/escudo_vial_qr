import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  PieChart, 
  Car, 
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function AnalyticsView() {
  const { emergencies, qrList, reports } = useApp();

  const totalCases = emergencies.length + reports.length;
  const resolvedEmergencies = emergencies.filter(e => e.status === 'resuelto').length;
  const resolutionRate = emergencies.length > 0 
    ? Math.round((resolvedEmergencies / emergencies.length) * 100) 
    : 100;

  return (
    <div className="flex flex-col gap-5 mt-4 animate-in fade-in">
      {/* 3 Tarjetas de Resumen Ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Éxito de Despacho</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {resolutionRate}%
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Asistencia efectiva en sitio
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flota Total Afiliada</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#532C8C] flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {qrList.filter(q => q.status === 'active').length} vehículos
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Stickers activos con cobertura 24/7
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas Totales Procesadas</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {totalCases} casos
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            S.O.S + Reportes ciudadanos
          </p>
        </div>
      </div>

      {/* Gráficos de Rendimiento y Horas Pico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico 1: Horas Pico de Incidentes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#532C8C]" />
                Distribución por Horarios (Horas Pico de Emergencia)
              </h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Últimos 30 días</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Mayor incidencia detectada en horario de retorno nocturno (18:00 - 22:00) y madrugadas de fin de semana.
            </p>
          </div>

          <div className="grid grid-cols-6 gap-2 items-end h-48 pt-6 pb-2">
            {[
              { label: '00-04h', val: 45, count: 18 },
              { label: '04-08h', val: 30, count: 12 },
              { label: '08-12h', val: 65, count: 26 },
              { label: '12-16h', val: 55, count: 22 },
              { label: '16-20h', val: 95, count: 38 },
              { label: '20-24h', val: 80, count: 32 },
            ].map(col => (
              <div key={col.label} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#532C8C] transition-colors">
                  {col.count}
                </span>
                <div 
                  style={{ height: `${col.val}%` }} 
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    col.val > 80 
                      ? 'bg-gradient-to-t from-[#532C8C] to-rose-500 group-hover:brightness-110' 
                      : 'bg-gradient-to-t from-slate-200 to-purple-200 group-hover:from-purple-300 group-hover:to-[#532C8C]'
                  }`}
                />
                <span className="text-[9.5px] font-semibold text-slate-500 whitespace-nowrap">
                  {col.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Desglose por Causa de Incidencia */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#00A896]" />
                Causas Principales de Asistencia
              </h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Categorías</span>
            </div>
          </div>

          <div className="space-y-3.5 my-auto py-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Fallas Mecánicas / Solicitud de Grúa</span>
                <span>48%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#00A896] rounded-full" style={{ width: '48%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Accidentes y Colisiones en Autopista</span>
                <span>28%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#E53838] rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Conducción Temeraria e Imprudencia</span>
                <span>16%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#532C8C] rounded-full" style={{ width: '16%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Urgencias Médicas / Ambulancia</span>
                <span>8%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

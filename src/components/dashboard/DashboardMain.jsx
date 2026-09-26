import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import DashboardHeader from './DashboardHeader';
import KpiCards from './KpiCards';
import LiveRadarView from './LiveRadarView';
import ReportsTableView from './ReportsTableView';
import QrManagerView from './QrManagerView';
import QrStandaloneExporterView from './QrStandaloneExporterView';
import AnalyticsView from './AnalyticsView';
import IncomingEmergencyModal from './IncomingEmergencyModal';
import ErrorBoundary from '../common/ErrorBoundary';
import { 
  Radio, 
  FileSpreadsheet, 
  QrCode, 
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function DashboardMain() {
  const { emergencies } = useApp();
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'reportes' | 'qrs' | 'exportador' | 'metricas'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);

  const activeEmergenciesCount = emergencies.filter(e => e.status !== 'resuelto').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Ventana Flotante Modal con Sirena de Emergencia Entrante */}
      <IncomingEmergencyModal 
        onAccepted={(emgId) => {
          setSelectedEmergencyId(emgId);
          setActiveTab('radar');
        }} 
      />

      {/* Header de la Torre de Despacho */}
      <DashboardHeader 
        onSearch={setSearchQuery} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Tarjetas KPI Superiores */}
        <KpiCards 
          onCardClick={(tab) => setActiveTab(tab)} 
          activeFilter={activeTab}
        />

        {/* Barra de Pestañas Principales */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          {[
            { 
              id: 'radar', 
              label: 'Radar & Despacho S.O.S', 
              icon: Radio,
              isEmergency: true,
              badgeCount: activeEmergenciesCount
            },
            { id: 'reportes', label: 'Bandeja de Reportes Viales', icon: FileSpreadsheet },
            { id: 'qrs', label: 'Gestión de Stickers / Lotes', icon: QrCode },
            { id: 'exportador', label: 'Exportador de QRs Puros (EV)', icon: Sparkles, highlight: true },
            { id: 'metricas', label: 'Métricas & Estadísticas', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  tab.isEmergency
                    ? isActive
                      ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/50'
                      : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 hover:border-rose-400'
                    : isActive
                      ? 'bg-[#532C8C] text-white shadow-sm shadow-purple-900/20'
                      : tab.highlight
                        ? 'text-[#00A896] bg-teal-50/70 border border-teal-200/80 hover:bg-teal-100/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.isEmergency && (
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
                <Icon className={`w-4 h-4 ${tab.isEmergency ? (isActive ? 'text-white' : 'text-rose-600') : (isActive ? 'text-teal-300' : tab.highlight ? 'text-[#00A896]' : 'text-slate-400')}`} />
                <span>{tab.label}</span>
                {tab.badgeCount > 0 && (
                  <span className="bg-white text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs animate-bounce ml-0.5">
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Vista Activa con ErrorBoundary */}
        <div className="flex-1">
          <ErrorBoundary key={activeTab}>
            {activeTab === 'radar' && (
              <LiveRadarView 
                searchQuery={searchQuery} 
                selectedEmergencyId={selectedEmergencyId}
                onSelectEmergency={setSelectedEmergencyId}
              />
            )}
            {activeTab === 'reportes' && <ReportsTableView searchQuery={searchQuery} />}
            {activeTab === 'qrs' && <QrManagerView searchQuery={searchQuery} onGoToExporter={() => setActiveTab('exportador')} />}
            {activeTab === 'exportador' && <QrStandaloneExporterView searchQuery={searchQuery} />}
            {activeTab === 'metricas' && <AnalyticsView />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

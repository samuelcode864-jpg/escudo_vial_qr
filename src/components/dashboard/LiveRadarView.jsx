import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TacticalLeafletMap from './TacticalLeafletMap';
import { 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Truck, 
  CheckCircle, 
  Clock, 
  Shield, 
  User, 
  Plus, 
  Navigation, 
  ExternalLink,
  Car,
  Trash2,
  Archive,
  RotateCcw
} from 'lucide-react';

export default function LiveRadarView({ searchQuery = '' }) {
  const { 
    emergencies, 
    updateEmergencyStatus, 
    addEmergencyNote,
    deleteEmergency,
    clearResolvedEmergencies
  } = useApp();
  
  const [radarFilter, setRadarFilter] = useState('activas'); // 'activas' | 'todas'
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(emergencies[0]?.id || null);
  const [newNoteText, setNewNoteText] = useState('');

  // Filtrado por buscador
  const filteredEmergencies = emergencies.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.folio.toLowerCase().includes(q) ||
      e.sku.toLowerCase().includes(q) ||
      e.cedula.toLowerCase().includes(q) ||
      e.holderName.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      (e.vehicle && e.vehicle.toLowerCase().includes(q))
    );
  });

  const activeEmergencies = filteredEmergencies.filter(e => e.status !== 'resuelto');
  const resolvedEmergencies = filteredEmergencies.filter(e => e.status === 'resuelto');
  const displayedEmergencies = radarFilter === 'activas' ? activeEmergencies : filteredEmergencies;

  const selectedEmergency = emergencies.find(e => e.id === selectedEmergencyId) || displayedEmergencies[0] || emergencies[0] || null;

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedEmergency) return;
    addEmergencyNote(selectedEmergency.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleDispatch = (unit) => {
    if (!selectedEmergency) return;
    updateEmergencyStatus(selectedEmergency.id, 'en_camino', unit);
  };

  const handleResolve = () => {
    if (!selectedEmergency) return;
    updateEmergencyStatus(selectedEmergency.id, 'resuelto');
  };

  const handleDelete = (id) => {
    const targetId = id || selectedEmergency?.id;
    if (!targetId) return;
    deleteEmergency(targetId);
    if (selectedEmergencyId === targetId) {
      setSelectedEmergencyId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
      {/* Columna Izquierda: Mapa de Radar y Rutas (7 Columnas en Desktop) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col">
          {/* Cabecera del Mapa */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 z-10 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeEmergencies.length > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
              <h3 className="text-white font-extrabold text-sm tracking-wide flex items-center gap-2">
                RADAR TÁCTICO VIAL EN TIEMPO REAL
              </h3>
            </div>

            {/* Toggle de Alertas & Botón para Limpiar Resueltos */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-950/90 p-0.5 rounded-xl border border-slate-700/80 flex items-center text-[11px]">
                <button
                  type="button"
                  onClick={() => setRadarFilter('activas')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    radarFilter === 'activas' 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Activas ({activeEmergencies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRadarFilter('todas')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    radarFilter === 'todas' 
                      ? 'bg-purple-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({emergencies.length})
                </button>
              </div>

              {resolvedEmergencies.length > 0 && (
                <button
                  type="button"
                  onClick={clearResolvedEmergencies}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Retirar del mapa todos los casos que ya fueron atendidos/resueltos"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Limpiar Resueltos ({resolvedEmergencies.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Mapa Táctico Interactivo con Calles Reales (OpenStreetMap / CartoDB / Satélite) */}
          <div className="my-3">
            <TacticalLeafletMap 
              emergencies={displayedEmergencies}
              selectedEmergency={selectedEmergency}
              onSelectEmergency={(id) => setSelectedEmergencyId(id)}
            />
          </div>

          {/* Selector Rápido de Emergencias en el Mapa */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {displayedEmergencies.length === 0 ? (
              <div className="text-[11px] text-slate-500 py-1.5 px-3 italic bg-slate-950/40 rounded-xl border border-slate-800">
                {radarFilter === 'activas' ? 'No hay casos activos pendientes' : 'Sin alertas registradas'}
              </div>
            ) : (
              displayedEmergencies.map((emg) => {
                const isSelected = selectedEmergency?.id === emg.id;
                return (
                  <button
                    key={emg.id}
                    onClick={() => setSelectedEmergencyId(emg.id)}
                    className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 border cursor-pointer ${
                      isSelected 
                        ? 'bg-rose-600/20 border-rose-500 text-white shadow-sm shadow-rose-900/40' 
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {emg.folio}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                        emg.status === 'critico' ? 'bg-rose-500 text-white' : emg.status === 'en_camino' ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {emg.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate max-w-[150px] mt-0.5">
                      {emg.holderName}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Tarjeta de Despacho Operativo (5 Columnas en Desktop) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {selectedEmergency ? (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg flex flex-col gap-4 animate-in fade-in">
            {/* Header del Caso */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-base text-slate-900">
                    {selectedEmergency.folio}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedEmergency.status === 'critico'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : selectedEmergency.status === 'en_camino'
                        ? 'bg-teal-100 text-teal-800 border border-teal-200'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedEmergency.status === 'critico' ? 'ALERTA CRÍTICA' : selectedEmergency.status === 'en_camino' ? 'DESPACHO ACTIVO' : 'CASO RESUELTO'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Reportado: {new Date(selectedEmergency.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* SKU Badge */}
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sticker QR</span>
                <span className="font-mono font-extrabold text-xs text-[#532C8C] bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                  {selectedEmergency.sku}
                </span>
              </div>
            </div>

            {/* Ficha del Afectado y Vehículo */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Titular Registrado</span>
                <span className="font-extrabold text-slate-800 text-[13px]">{selectedEmergency.holderName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200/60 pb-2">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Cédula</span>
                  <span className="font-semibold text-slate-800">{selectedEmergency.cedula}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Reportante</span>
                  <span className={`font-bold capitalize ${
                    selectedEmergency.reporterType === 'titular' ? 'text-teal-700' : 'text-purple-700'
                  }`}>
                    {selectedEmergency.reporterType === 'titular' ? '👤 Titular' : '👥 Tercero / Testigo'}
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Vehículo / Placa</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
                  <Car className="w-3.5 h-3.5 text-[#532C8C]" />
                  <span>{selectedEmergency.vehicle || 'Vehículo en vía'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Ubicación GPS</span>
                <div className="flex items-start gap-1 text-slate-700 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{selectedEmergency.location.address}</span>
                </div>
              </div>
            </div>

            {/* Acciones de Contacto Rápido a 1 Clic */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedEmergency.phone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-700/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar al Usuario</span>
              </a>

              <a
                href={`https://wa.me/${selectedEmergency.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${selectedEmergency.holderName}, nos comunicamos desde la Central de Monitoreo de Escudo Vial con respecto a tu alerta ${selectedEmergency.folio}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#00A896] hover:bg-[#008677] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-teal-700/20"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Directo</span>
              </a>
            </div>

            {/* Botón de Acción Principal de la Torre de Control */}
            <div className="flex flex-col gap-2">
              {selectedEmergency.status === 'critico' ? (
                <button
                  type="button"
                  onClick={() => handleDispatch('Unidad de Auxilio Vial')}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 active:scale-[0.98] text-white font-black text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer uppercase tracking-wider"
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>ACEPTAR Y ATENDER EMERGENCIA</span>
                </button>
              ) : selectedEmergency.status === 'en_camino' ? (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center justify-between text-xs text-teal-900 font-extrabold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
                    <span>¡EMERGENCIA ACEPTADA Y EN ATENCIÓN!</span>
                  </div>
                  <span className="bg-teal-200/80 text-teal-800 text-[10px] px-2 py-0.5 rounded-md uppercase">
                    En Curso
                  </span>
                </div>
              ) : (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-700 font-bold">
                  <span>Asistencia solventada y cerrada</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md uppercase">
                    Resuelto
                  </span>
                </div>
              )}
            </div>

            {/* Bitácora de Novedades del Caso */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Bitácora de Seguimiento
              </span>
              
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {selectedEmergency.notes?.map((n, i) => (
                  <div key={i} className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span className="font-bold text-[#532C8C] shrink-0 font-mono text-[10px]">{n.time}</span>
                    <span className="text-slate-700">{n.text}</span>
                  </div>
                ))}
              </div>

              {/* Input para agregar notas */}
              <form onSubmit={handleAddNote} className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Agregar actualización al caso..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#532C8C]"
                />
                <button
                  type="submit"
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Acciones de Cierre / Retiro del Caso */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {selectedEmergency.status === 'en_camino' && (
                <button
                  type="button"
                  onClick={handleResolve}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>FINALIZAR Y MARCAR COMO RESUELTO</span>
                </button>
              )}

              {selectedEmergency.status === 'resuelto' && (
                <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>CASO ATENDIDO Y RESUELTO</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => updateEmergencyStatus(selectedEmergency.id, 'critico')}
                    className="text-[10px] text-emerald-700 underline font-semibold hover:text-emerald-900 cursor-pointer"
                  >
                    Reabrir
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDelete(selectedEmergency.id)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Descartar o quitar caso del radar"
              >
                <Trash2 className="w-4 h-4" />
                <span>Descartar / Quitar Caso del Radar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center h-full min-h-[380px]">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-3 border border-teal-100 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">
              Torre de Monitoreo Activa 24/7
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              No hay emergencias en curso en este momento. La central está en escucha activa para recibir transmisiones S.O.S reales desde cualquier sticker QR escaneado.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 flex items-center gap-2 max-w-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>Para registrar una alerta real, escanea o abre un QR en el móvil y presiona el botón S.O.S.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

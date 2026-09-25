import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalReportar({ isOpen, onClose }) {
  const { activeSku, submitReport } = useApp();

  const [selectedReason, setSelectedReason] = useState('Conducción temeraria o maniobra indebida');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [view, setView] = useState('form'); // 'form' | 'success'

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const rep = submitReport({
        sku: activeSku,
        reason: selectedReason,
        details: details
      });
      setSubmittedReport(rep);
      setLoading(false);
      setView('success');
    }, 700);
  };

  const handleClose = () => {
    setView('form');
    setDetails('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col shadow-2xl relative border border-purple-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {/* Botón Cerrar X */}
        <button
          type="button"
          aria-label="Cerrar modal de reporte"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {view === 'form' ? (
          /* VISTA 1: Formulario de Reporte */
          <div className="flex flex-col w-full">
            <div className="flex items-start gap-3.5 pr-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E53838] flex items-center justify-center shrink-0 shadow-sm border border-rose-100">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  report_problem
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3 className="text-slate-900 font-extrabold text-[16px] leading-tight">
                    Reportar este conductor
                  </h3>
                  <span className="bg-rose-100 text-[#E53838] font-extrabold text-[9.5px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">security</span> Confidencial
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] font-semibold mt-0.5">
                  Monitoreo de seguridad y auxilio vial
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-[12.5px] mt-3 leading-snug bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Selecciona el motivo del incidente. Tu reporte se envía geolocalizado en tiempo real a la central de soporte.
            </p>

            {/* Formulario con 3 opciones seleccionables */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2.5 mt-3">
              {/* Opción 1 */}
              <label 
                className={`relative flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
                  selectedReason === 'Conducción temeraria o maniobra indebida'
                    ? 'border-[#00A896] bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-[#00A896]/70'
                }`}
              >
                <input
                  type="radio"
                  name="report_reason"
                  className="sr-only"
                  checked={selectedReason === 'Conducción temeraria o maniobra indebida'}
                  onChange={() => setSelectedReason('Conducción temeraria o maniobra indebida')}
                />
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#532C8C] flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-purple-100">
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                </div>
                <div className="flex-1 min-w-0 pr-5 text-left">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">
                    Conducción temeraria o maniobra indebida
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Exceso de velocidad, zigzagueo o imprudencia grave.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 absolute right-3 top-3.5 transition-all ${
                  selectedReason === 'Conducción temeraria o maniobra indebida' ? 'border-[#00A896]' : 'border-slate-300'
                }`}>
                  {selectedReason === 'Conducción temeraria o maniobra indebida' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00A896]" />
                  )}
                </div>
              </label>

              {/* Opción 2 */}
              <label 
                className={`relative flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
                  selectedReason === 'Accidente o colisión en la vía'
                    ? 'border-[#00A896] bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-[#00A896]/70'
                }`}
              >
                <input
                  type="radio"
                  name="report_reason"
                  className="sr-only"
                  checked={selectedReason === 'Accidente o colisión en la vía'}
                  onChange={() => setSelectedReason('Accidente o colisión en la vía')}
                />
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E53838] flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-rose-100">
                  <span className="material-symbols-outlined text-[20px]">car_crash</span>
                </div>
                <div className="flex-1 min-w-0 pr-5 text-left">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">
                    Accidente o colisión en la vía
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Impacto con vehículo, objeto o peatón que requiere asistencia.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 absolute right-3 top-3.5 transition-all ${
                  selectedReason === 'Accidente o colisión en la vía' ? 'border-[#00A896]' : 'border-slate-300'
                }`}>
                  {selectedReason === 'Accidente o colisión en la vía' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00A896]" />
                  )}
                </div>
              </label>

              {/* Opción 3 */}
              <label 
                className={`relative flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
                  selectedReason === 'Vehículo o conductor sospechoso / no identificado'
                    ? 'border-[#00A896] bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-[#00A896]/70'
                }`}
              >
                <input
                  type="radio"
                  name="report_reason"
                  className="sr-only"
                  checked={selectedReason === 'Vehículo o conductor sospechoso / no identificado'}
                  onChange={() => setSelectedReason('Vehículo o conductor sospechoso / no identificado')}
                />
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-teal-100">
                  <span className="material-symbols-outlined text-[20px]">person_alert</span>
                </div>
                <div className="flex-1 min-w-0 pr-5 text-left">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">
                    Vehículo o conductor sospechoso / no identificado
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Placas alteradas, comportamiento extraño o sin datos oficiales.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 absolute right-3 top-3.5 transition-all ${
                  selectedReason === 'Vehículo o conductor sospechoso / no identificado' ? 'border-[#00A896]' : 'border-slate-300'
                }`}>
                  {selectedReason === 'Vehículo o conductor sospechoso / no identificado' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00A896]" />
                  )}
                </div>
              </label>

              {/* Campo de texto para detalles adicionales */}
              <div className="flex flex-col gap-1 mt-1 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1" htmlFor="reportDetailsInput">
                    <span className="material-symbols-outlined text-[14px] text-[#532C8C]">edit_note</span>
                    <span>Detalles del incidente</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {details.length} / 250
                  </span>
                </div>
                <textarea
                  id="reportDetailsInput"
                  rows={3}
                  maxLength={250}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe los detalles del incidente o información adicional (opcional)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-[12.5px] placeholder:text-slate-400 focus:outline-none focus:border-[#532C8C] focus:ring-1 focus:ring-[#532C8C] transition-all resize-none"
                />
              </div>

              {/* Botón Principal ENVIAR REPORTE */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-gradient-to-r from-[#E53838] to-rose-600 hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-md shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {loading ? 'sync' : 'send'}
                </span>
                <span>{loading ? 'Enviando reporte...' : 'ENVIAR REPORTE'}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full text-slate-500 hover:text-slate-800 text-[12px] font-semibold py-1 transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
            </form>
          </div>
        ) : (
          /* VISTA 2: Confirmación y Mensaje de Éxito Interactivo */
          <div className="flex flex-col items-center text-center w-full py-3">
            <div className="relative flex items-center justify-center w-20 h-20 mb-3">
              <div className="absolute inset-0 rounded-full bg-rose-100 animate-ping opacity-60" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 animate-success-pop">
                <span className="material-symbols-outlined text-[42px] font-bold">verified</span>
              </div>
            </div>

            <span className="bg-rose-50 text-[#E53838] border border-rose-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E53838] animate-pulse" />
              REPORTE ENVIADO
            </span>

            <h3 className="text-slate-900 font-extrabold text-[19px] tracking-tight leading-tight">
              ¡Reporte recibido!
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-3 w-full text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Motivo</span>
                <span className="text-[12px] font-bold text-slate-800 text-right truncate ml-2 max-w-[200px]">
                  {selectedReason}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Folio Caso</span>
                <span className="text-[12px] font-extrabold font-mono text-[#532C8C] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                  {submittedReport?.folio || '#REP-7731-SEG'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acción Central</span>
                <span className="text-[11px] font-extrabold text-teal-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">radar</span> Rastreo activo
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-[12.5px] mt-3 leading-snug px-1">
              La central de monitoreo ha registrado el reporte y las coordenadas para investigación inmediata.
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-4 w-full bg-[#532C8C] hover:bg-[#432172] active:scale-[0.98] text-white font-extrabold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>ENTENDIDO Y CERRAR</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

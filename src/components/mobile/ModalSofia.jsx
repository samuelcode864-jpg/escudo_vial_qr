import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalSofia({ isOpen, onClose }) {
  const { activeSku } = useApp();

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Emergencia Vial SKU ${activeSku}. Requiero asistencia de grúa o auxilio vial en carretera.`
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col shadow-2xl relative border border-purple-100 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              smart_toy
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <h3 className="text-slate-900 font-bold text-[16px] leading-tight">
                WhatsApp Sofía (IA)
              </h3>
              <span className="bg-teal-100 text-[#00A896] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                ASISTENTE
              </span>
            </div>
            <p className="text-slate-600 text-[13px] mt-1.5 leading-snug">
              Gestión de grúas, auxilio vial y reporte en tiempo real vía WhatsApp automatizado.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-slate-700 text-[12px] leading-relaxed">
          <p className="font-semibold text-[#008677] flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Conexión Segura Directa
          </p>
          Sofía identificará tu vehículo automáticamente con tu código <strong>#{activeSku}</strong> al iniciar la conversación.
        </div>

        {/* Botón de Acción Principal */}
        <a
          href={`https://wa.me/573009110000?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full bg-[#00A896] hover:bg-[#008677] text-white font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wider shadow-md text-center"
        >
          <span className="material-symbols-outlined text-[19px]">chat</span>
          <span>Chatear con Sofía</span>
        </a>
      </div>
    </div>
  );
}

import React from 'react';

export default function ModalAfiliacion({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col shadow-2xl relative border border-purple-100 animate-in zoom-in-95 duration-200"
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
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#532C8C] flex items-center justify-center shrink-0 shadow-sm border border-purple-100">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              verified
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <h3 className="text-slate-900 font-bold text-[16px] leading-tight">
                Afiliación y Cobertura
              </h3>
            </div>
            <p className="text-slate-600 text-[13px] mt-1.5 leading-snug">
              Descarga la app oficial de Escudo Vial para gestionar tu póliza, pagar renovación y registrar más vehículos.
            </p>
          </div>
        </div>

        <a
          href="https://play.google.com/store/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full bg-[#532C8C] hover:bg-[#432172] text-white font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wider shadow-md text-center"
        >
          <span className="material-symbols-outlined text-[19px]">shop</span>
          <span>descargar app</span>
        </a>
      </div>
    </div>
  );
}

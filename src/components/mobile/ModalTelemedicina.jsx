import React from 'react';

export default function ModalTelemedicina({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col shadow-2xl relative border border-purple-100 max-h-[88vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              medical_services
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <h3 className="text-slate-900 font-bold text-[16px] leading-tight">
                Central Médica 24/7
              </h3>
              <span className="bg-teal-100 text-[#00A896] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                BENEFICIOS
              </span>
            </div>
            <p className="text-slate-500 text-[12px] mt-0.5 font-medium">
              Telemedicina & Asistencia Vial
            </p>
          </div>
        </div>

        {/* Lista de Beneficios */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="material-symbols-outlined text-[#00A896] text-[20px] shrink-0 mt-0.5">
              support_agent
            </span>
            <div className="text-left">
              <p className="text-slate-800 text-[12px] font-bold leading-tight">Orientación 24/7 telefónica</p>
              <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                Consultas médicas telefónicas y por videollamada al instante.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="material-symbols-outlined text-[#E53838] text-[20px] shrink-0 mt-0.5">
              ambulance
            </span>
            <div className="text-left">
              <p className="text-slate-800 text-[12px] font-bold leading-tight">Vídeo llamada y Ambulancia</p>
              <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                Coordinación y despacho prioritario en accidentes o urgencias viales.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="material-symbols-outlined text-[#532C8C] text-[20px] shrink-0 mt-0.5">
              prescriptions
            </span>
            <div className="text-left">
              <p className="text-slate-800 text-[12px] font-bold leading-tight">Órdenes Digitales</p>
              <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                Envío inmediato de récipes y órdenes de laboratorio a tu móvil.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="material-symbols-outlined text-teal-600 text-[20px] shrink-0 mt-0.5">
              speed
            </span>
            <div className="text-left">
              <p className="text-slate-800 text-[12px] font-bold leading-tight">Entrega de medicamentos</p>
              <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                Gestión y entrega de medicamentos a costos especiales.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="material-symbols-outlined text-purple-600 text-[20px] shrink-0 mt-0.5">
              family_restroom
            </span>
            <div className="text-left">
              <p className="text-slate-800 text-[12px] font-bold leading-tight">Cobertura Integral</p>
              <p className="text-slate-500 text-[11px] leading-snug mt-0.5">
                Válido para el titular y acompañantes que viajen en ruta.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-2">
          <a
            href="tel:018000911000"
            className="w-full bg-[#00A896] hover:bg-[#008677] text-white font-bold text-[13px] py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wider shadow-md text-center"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>CONSULTAR CON UN MÉDICO</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
}

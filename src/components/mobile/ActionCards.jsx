import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ActionCards({ 
  onOpenTelemedicinaModal, 
  onOpenQrModal, 
  onOpenReportModal 
}) {
  const { currentQr, activeSku } = useApp();
  const isQrActive = currentQr?.status === 'active';

  return (
    <section className="flex flex-col space-y-3 pt-1">
      {/* Tarjeta 1: Central Médica 24/7 */}
      <article className="bg-white rounded-2xl p-4 shadow-card-lift border border-purple-100 relative overflow-hidden transition-all hover:-translate-y-0.5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              medical_services
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-slate-900 font-bold text-[16px] leading-tight">
                Atención Médica&nbsp;
              </h4>
              <span className="bg-purple-100 text-[#532C8C] font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                PRÓXIMAMENTE
              </span>
            </div>
            <p className="text-slate-600 text-[13px] mt-1 leading-snug">
              Orientación médica inmediata y triage de ambulancias.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTelemedicinaModal}
          className="mt-3.5 w-full bg-[#00A896] hover:bg-[#008677] text-white font-bold text-[13px] py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wider shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>VER BENEFICIOS</span>
        </button>
      </article>

      {/* Tarjeta 2: QR & Vehículo Vinculado (Interactuable) */}
      {isQrActive && currentQr?.holder ? (
        <article className="bg-white rounded-2xl p-4 shadow-card-lift border border-teal-100 relative overflow-hidden transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                verified
              </span>
              <span className="text-[13px] font-extrabold text-slate-900">
                Sticker {activeSku} Activo
              </span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
              PROTEGIDO 24/7
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehículo / Placa</span>
              <span className="font-extrabold text-slate-800 text-[12px] block truncate">
                {currentQr.holder.vehicle}
              </span>
              <span className="font-mono font-bold text-[#532C8C] text-[11px]">
                {currentQr.holder.plate}
              </span>
            </div>

            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Titular / Sangre</span>
              <span className="font-bold text-slate-800 text-[12px] block truncate">
                {currentQr.holder.name}
              </span>
              <span className="font-extrabold text-rose-600 text-[11px]">
                Tipo: {currentQr.holder.bloodType || 'O+'}
              </span>
            </div>
          </div>

          {/* Contacto de Emergencia con Botón de Llamada Rápida */}
          {currentQr.holder.emergencyContactPhone && (
            <div className="mt-2.5 flex items-center justify-between bg-teal-50/70 p-2 rounded-xl border border-teal-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 truncate pr-2">
                <span className="material-symbols-outlined text-[#00A896] text-[16px] shrink-0">contact_phone</span>
                <span className="text-[11px] truncate font-semibold">
                  {currentQr.holder.emergencyContactName || 'Familiar de Contacto'}
                </span>
              </div>
              <a
                href={`tel:${currentQr.holder.emergencyContactPhone}`}
                className="bg-[#00A896] hover:bg-[#008677] text-white font-extrabold text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[13px]">call</span>
                <span>Llamar</span>
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenQrModal}
            className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Ver Ficha Completa
          </button>
        </article>
      ) : (
        /* Si está sin activar: Botón Prominente Activar QR */
        <button
          type="button"
          id="openActivarQrBtn"
          onClick={onOpenQrModal}
          className="w-full bg-gradient-to-r from-[#00A896] to-[#008f80] hover:brightness-105 active:scale-[0.98] text-white font-extrabold text-[14px] py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-lg shadow-teal-900/30 border border-teal-300/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="leading-tight tracking-wide font-extrabold">ACTIVAR QR</span>
              <span className="text-[11px] text-white/80 font-medium">Vincular vehículo a cobertura 24/7</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase">
            <span>Comenzar</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </div>
        </button>
      )}

      {/* Botón Prominente: 'Reportar este conductor / Usuario' */}
      <button
        type="button"
        id="openReportConductorBtn"
        onClick={onOpenReportModal}
        className="w-full bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-extrabold text-[14px] py-3.5 px-4 rounded-2xl flex items-center gap-3 backdrop-blur-md border border-white/20 transition-all cursor-pointer group shadow-sm"
      >
        <div className="w-9 h-9 rounded-xl bg-white/15 text-rose-400 border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
          <span className="material-symbols-outlined text-[20px]">warning</span>
        </div>
        <span className="leading-tight tracking-wide font-extrabold text-white text-left">
          Reportar este conductor / Usuario
        </span>
      </button>
    </section>
  );
}

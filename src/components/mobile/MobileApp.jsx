import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import MobileHeader from './MobileHeader';
import SosHero from './SosHero';
import ActionCards from './ActionCards';
import BottomNav from './BottomNav';

import ModalActivarQr from './ModalActivarQr';
import ModalReportar from './ModalReportar';
import ModalSos from './ModalSos';
import ModalTelemedicina from './ModalTelemedicina';
import ModalSofia from './ModalSofia';
import ModalAfiliacion from './ModalAfiliacion';

export default function MobileApp({ showSimulatorBar = false }) {
  const { sku: routeSku } = useParams();
  const { activeSku, setActiveSku, qrList, currentQr: contextQr } = useApp();

  // Estados de modales
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isTelemedicinaModalOpen, setIsTelemedicinaModalOpen] = useState(false);
  const [isSofiaModalOpen, setIsSofiaModalOpen] = useState(false);
  const [isAfiliacionModalOpen, setIsAfiliacionModalOpen] = useState(false);

  // SKU prioritario: Si viene por URL /v/:sku o del contexto
  const effectiveSku = (routeSku || activeSku || 'EV8842VE').replace(/[#-]/g, '').toUpperCase();
  const matchedQr = qrList.find(q => q.sku.toUpperCase() === effectiveSku);
  const currentQr = matchedQr || (contextQr?.sku?.toUpperCase() === effectiveSku ? contextQr : {
    sku: effectiveSku,
    status: 'inactive',
    holder: null,
    scansCount: 0
  });

  const isQrActive = currentQr?.status === 'active';
  const cleanSku = effectiveSku;

  return (
    <div className="w-full min-h-[100dvh] bg-gradient-to-b from-[#532C8C] via-[#4b2581] to-[#432172] text-slate-800 font-sans flex flex-col relative antialiased selection:bg-[#00A896] selection:text-white">
      {/* Barra de simulación solo si se solicita explícitamente en modo demo */}
      {showSimulatorBar && (
        <div className="w-full bg-slate-950/90 border-b border-white/10 px-3 py-1 flex items-center justify-between text-xs text-white z-50">
          <span className="text-[11px] font-mono text-teal-300 truncate">QR: {cleanSku}</span>
          <select 
            value={activeSku}
            onChange={(e) => setActiveSku(e.target.value)}
            className="bg-white/10 text-white text-[11px] rounded px-2 py-0.5 border border-white/20"
          >
            {qrList.map(q => {
              const itemCleanSku = q.sku.replace(/[#-]/g, '').toUpperCase();
              return (
                <option key={q.sku} value={q.sku} className="bg-slate-900 text-white">
                  {itemCleanSku} ({q.status === 'active' ? 'Activo' : 'Sin activar'})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Header Institucional Fijo Superior */}
      <MobileHeader onOpenReportModal={() => {
        if (!isQrActive) {
          setIsQrModalOpen(true);
        } else {
          setIsReportModalOpen(true);
        }
      }} />

      {/* Contenedor Principal de la App */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-40">
        <div className="flex flex-col w-full px-4 space-y-4 max-w-md mx-auto relative">
          
          {/* ======================================================== */}
          {/* ESTADO 1: STICKER NUEVO / SIN VINCULAR (MÁXIMO PROTAGONISMO) */}
          {/* ======================================================== */}
          {!isQrActive ? (
            <div className="flex flex-col items-center text-center mt-2 animate-in fade-in zoom-in-95 duration-200">
              {/* Ícono de Escaneo / Activación con Ondas */}
              <div className="relative flex items-center justify-center w-28 h-28 my-2">
                <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping opacity-75" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#00A896] to-emerald-400 text-white flex items-center justify-center shadow-xl shadow-teal-900/40 border border-teal-200/30">
                  <span className="material-symbols-outlined text-[48px]">
                    qr_code_scanner
                  </span>
                </div>
              </div>

              {/* Badge del SKU limpio */}
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 text-amber-200 px-3.5 py-1 rounded-full text-xs font-mono font-extrabold tracking-wider my-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>STICKER VIRGEN: {cleanSku}</span>
              </div>

              <h2 className="text-white font-extrabold text-[22px] tracking-tight leading-tight mt-1">
                ¡Bienvenido a Escudo Vial!
              </h2>
              <p className="text-white/80 text-[13px] font-medium leading-relaxed max-w-xs mt-2">
                Has escaneado un sticker físico oficial. Para habilitar tu <strong>botón de auxilio S.O.S satelital</strong> y cobertura 24/7, registra tu vehículo a continuación:
              </p>

              {/* Botón Principal Gigante y Protagonista */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="mt-5 w-full bg-gradient-to-r from-[#00A896] via-teal-500 to-emerald-500 hover:brightness-110 active:scale-95 text-white font-extrabold text-[15px] py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 uppercase tracking-wider shadow-xl shadow-teal-950/40 border border-teal-300/30 transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">
                  verified_user
                </span>
                <span>VINCULAR Y ACTIVAR AHORA</span>
              </button>

              {/* Sección de Servicios Bloqueados (Explicación clara de por qué deben registrarse) */}
              <div className="w-full mt-6 bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block mb-2">
                  🔒 SERVICIOS PENDIENTES POR ACTIVAR
                </span>

                <div className="space-y-2.5 text-xs text-white/70">
                  <div 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-400 text-[18px]">lock</span>
                      <span className="font-semibold text-white/90">Botón de Pánico S.O.S y Despacho Satelital</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold">Bloqueado</span>
                  </div>

                  <div 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-400 text-[18px]">lock</span>
                      <span className="font-semibold text-white/90">Triage de Ambulancia y Grúa 24/7</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold">Bloqueado</span>
                  </div>

                  <div 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-[18px]">lock</span>
                      <span className="font-semibold text-white/90">Contacto Familiar y Ficha Médica</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold">Bloqueado</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* ESTADO 2: STICKER ACTIVO / PROTEGIDO (S.O.S HABILITADO) */
            /* ======================================================== */
            <>
              {/* Badge superior compacto de vehículo protegido */}
              <div className="flex items-center justify-between bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-[11px] text-white shadow-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-extrabold truncate">{currentQr.holder.vehicle}</span>
                  <span className="text-white/50">•</span>
                  <span className="font-mono text-teal-300 font-bold">{currentQr.holder.plate}</span>
                </div>
                <span className="text-[10px] font-mono text-white/80 font-bold bg-white/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  {cleanSku}
                </span>
              </div>

              {/* Botón de Pánico Central S.O.S */}
              <SosHero onOpenSosModal={() => setIsSosModalOpen(true)} />

              {/* Tarjetas de Asistencia y QR */}
              <ActionCards 
                onOpenTelemedicinaModal={() => setIsTelemedicinaModalOpen(true)}
                onOpenQrModal={() => setIsQrModalOpen(true)}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            </>
          )}
        </div>
      </main>

      {/* Barra Inferior de Navegación Flotante (Solo activa si ya está vinculado) */}
      {isQrActive && (
        <BottomNav 
          onOpenAfiliacionModal={() => setIsAfiliacionModalOpen(true)}
          onOpenSosModal={() => setIsSosModalOpen(true)}
          onOpenSofiaModal={() => setIsSofiaModalOpen(true)}
        />
      )}

      {/* Modales Interactivos */}
      <ModalActivarQr 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
        targetSku={cleanSku}
      />

      <ModalReportar 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />

      <ModalSos 
        isOpen={isSosModalOpen} 
        onClose={() => setIsSosModalOpen(false)} 
      />

      <ModalTelemedicina 
        isOpen={isTelemedicinaModalOpen} 
        onClose={() => setIsTelemedicinaModalOpen(false)} 
      />

      <ModalSofia 
        isOpen={isSofiaModalOpen} 
        onClose={() => setIsSofiaModalOpen(false)} 
      />

      <ModalAfiliacion 
        isOpen={isAfiliacionModalOpen} 
        onClose={() => setIsAfiliacionModalOpen(false)} 
      />
    </div>
  );
}

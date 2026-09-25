import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getDeviceLocation } from '../../utils/geoUtils';
import confetti from 'canvas-confetti';

export default function ModalSos({ isOpen, onClose }) {
  const { activeSku, currentQr, triggerSos } = useApp();

  const [selectedRole, setSelectedRole] = useState('titular');
  const [isSending, setIsSending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedEmergency, setConfirmedEmergency] = useState(null);
  const [detectedGeo, setDetectedGeo] = useState(null);

  // Al abrir el modal, resetear estado y capturar GPS en segundo plano
  useEffect(() => {
    if (isOpen) {
      setSelectedRole('titular');
      setIsSending(false);
      setIsConfirmed(false);
      setConfirmedEmergency(null);

      // Detección silenciosa de GPS
      getDeviceLocation()
        .then((geo) => {
          if (geo) setDetectedGeo(geo);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Confirmar y despachar de inmediato al tocar cualquier opción
  const handleConfirm = async (role) => {
    if (isSending) return;
    setIsSending(true);

    try {
      const emergency = await triggerSos({
        sku: activeSku,
        cedula: currentQr?.holder?.cedula || 'V-00.000.000',
        phone: currentQr?.holder?.phone || 'Sin número',
        reporterType: role,
        gpsEnabled: true,
        detectedCoords: detectedGeo
      });

      setConfirmedEmergency(emergency);
      setIsConfirmed(true);

      // Disparar confeti de confirmación visible al frente del modal
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.55 },
          zIndex: 99999
        });
      } catch {
        // Ignorar si confetti falla
      }
    } catch (err) {
      console.error('Error al despachar alerta S.O.S:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    setConfirmedEmergency(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) handleClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative border border-purple-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {!isConfirmed ? (
          /* ======================================================== */
          /* PASO DIRECTO: SELECCIÓN DE QUIÉN REPORTA (TITULAR DEFAULT) */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center">
            {/* Ícono de Alerta de Emergencia */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#E53838] flex items-center justify-center mb-2 shadow-inner border border-rose-100">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                e911_emergency
              </span>
            </div>

            <h3 className="text-[#532C8C] font-extrabold text-[20px] tracking-tight leading-tight uppercase mb-1">
              ¿Quién está reportando?
            </h3>
            <p className="text-slate-600 text-[12px] leading-snug mb-4">
              Selecciona para despachar de inmediato la asistencia vial a tu ubicación:
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Opción 1: Soy el Titular (PRE-SELECCIONADO POR DEFECTO) */}
              <button
                type="button"
                onClick={() => handleConfirm('titular')}
                disabled={isSending}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm relative border-2 ${
                  selectedRole === 'titular'
                    ? 'border-[#532C8C] bg-purple-50/70 ring-2 ring-purple-300/30'
                    : 'border-slate-200 bg-white hover:bg-purple-50'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#532C8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-[14px]">Soy el titular</span>
                    <span className="bg-purple-200/80 text-[#532C8C] text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider">
                      Predeterminado
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11.5px] leading-tight mt-0.5">
                    La póliza o vehículo me pertenece
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#532C8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                </div>
              </button>

              {/* Opción 2: Soy un Tercero / Testigo */}
              <button
                type="button"
                onClick={() => handleConfirm('tercero')}
                disabled={isSending}
                className="w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm border border-slate-200 bg-white hover:bg-teal-50/70 hover:border-[#00A896]"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-100 text-[#00A896] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">group</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-[14px]">Soy un tercero / testigo</div>
                  <div className="text-slate-500 text-[11.5px] leading-tight mt-0.5">
                    Acompañante, testigo o socorrista en la vía
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400">
                  chevron_right
                </span>
              </button>
            </div>

            {/* Botón Principal de Envío Inmediato */}
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleConfirm(selectedRole)}
              className="w-full mt-4 bg-gradient-to-r from-[#E53838] to-[#c72626] hover:brightness-110 py-3.5 rounded-2xl text-white font-extrabold text-[13.5px] uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span>TRANSMITIENDO A LA CENTRAL...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                    send
                  </span>
                  <span>ENVIAR ALERTA AHORA (S.O.S)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={handleClose}
              className="mt-3 text-slate-400 hover:text-slate-600 text-[12px] font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        ) : (
          /* ======================================================== */
          /* PANTALLA DE CONFIRMACIÓN ULTRA-GENIAL (REEMPLAZA EL ALERT) */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
            {/* Animación de Baliza / Sirena Satelital */}
            <div className="relative flex items-center justify-center my-3">
              <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-emerald-400 opacity-40"></span>
              <span className="animate-pulse absolute inline-flex h-16 w-16 rounded-full bg-emerald-300 opacity-60"></span>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-white">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  check_circle
                </span>
              </div>
            </div>

            <h3 className="text-slate-900 font-extrabold text-[19px] tracking-tight uppercase leading-tight">
              ¡Alerta S.O.S Despachada!
            </h3>
            <p className="text-slate-600 text-[12px] leading-snug mt-1 mb-3">
              La Torre de Control 24/7 ha recibido tu señal y está coordinando el auxilio vial.
            </p>

            {/* Tarjeta de Detalles del Despacho */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Folio Oficial:</span>
                <span className="font-mono text-[12px] font-black text-[#532C8C] bg-purple-100 px-2 py-0.5 rounded-md">
                  {confirmedEmergency?.folio || '#SOS-VENEZUELA'}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[17px] text-[#00A896] shrink-0 mt-0.5">
                  my_location
                </span>
                <div className="text-[11.5px] text-slate-700 leading-tight">
                  <span className="font-bold text-slate-900 block">Ubicación Transmitida:</span>
                  <span className="text-slate-600">{confirmedEmergency?.location?.address || 'Ubicación satelital en vivo'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[17px] text-emerald-600 shrink-0">
                  verified
                </span>
                <div className="text-[11.5px] text-slate-700">
                  <span className="font-bold text-slate-900">Estado: </span>
                  <span className="text-emerald-700 font-extrabold uppercase">Unidad en coordinación</span>
                </div>
              </div>
            </div>

            {/* Botón de Llamada Telefónica Directa de Emergencia */}
            <a
              href="tel:0800372836"
              className="w-full mt-3.5 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[17px] text-emerald-400">call</span>
              <span>Llamar Central Directo (0800-ESCUDO)</span>
            </a>

            {/* Botón Entendido / Cerrar */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full mt-2 bg-[#00A896] hover:bg-[#008677] text-white py-3 rounded-xl font-bold text-[12.5px] uppercase tracking-wider shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              ENTENDIDO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getDeviceLocation } from '../../utils/geoUtils';
import confetti from 'canvas-confetti';
import { 
  ShieldAlert, 
  User, 
  Users, 
  Check, 
  RefreshCw, 
  Send, 
  Truck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Radio, 
  Navigation, 
  Clock, 
  Phone, 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ModalSos({ isOpen, onClose }) {
  const { 
    activeSku, 
    currentQr, 
    triggerSos, 
    emergencies, 
    currentLocation,
    sendEmergencyChatMessage 
  } = useApp();

  const [selectedRole, setSelectedRole] = useState('titular');
  const [isSending, setIsSending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedEmergency, setConfirmedEmergency] = useState(null);
  const [detectedGeo, setDetectedGeo] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const chatScrollRef = useRef(null);

  // Obtener en tiempo real la emergencia activa vinculada a este folio o SKU
  const liveEmergency = (emergencies || []).find(e => 
    (confirmedEmergency?.id && e.id === confirmedEmergency.id) ||
    (confirmedEmergency?.folio && e.folio === confirmedEmergency.folio) ||
    (e.sku?.toUpperCase() === (activeSku || '').toUpperCase() && e.status !== 'resuelto')
  ) || confirmedEmergency;

  // Auto-scroll al final del chat cuando entran nuevos mensajes
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [liveEmergency?.notes]);

  // Al abrir el modal, resetear estado y capturar GPS en segundo plano
  useEffect(() => {
    if (isOpen) {
      setSelectedRole('titular');
      setIsSending(false);
      setIsConfirmed(false);
      setConfirmedEmergency(null);
      setChatMessage('');

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

    const safeRole = role || selectedRole || 'titular';
    const tempFolio = `#SOS-${Math.floor(1000 + Math.random() * 9000)}-CRT`;

    // Obtener las mejores coordenadas disponibles inmediatamente
    let coordsToUse = detectedGeo || currentLocation;
    if (!coordsToUse) {
      try {
        coordsToUse = await Promise.race([
          getDeviceLocation(),
          new Promise(r => setTimeout(r, 600))
        ]);
        if (coordsToUse) setDetectedGeo(coordsToUse);
      } catch {}
    }

    const finalAddress = coordsToUse?.address || 'Ubicación satelital transmitida en vivo a la Central';

    // 1. Mostrar pantalla de espera con la dirección real exacta
    setConfirmedEmergency({
      folio: tempFolio,
      location: { 
        address: finalAddress,
        lat: coordsToUse?.lat,
        lng: coordsToUse?.lng
      }
    });
    setIsConfirmed(true);

    // 2. Disparar confeti inmediatamente
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          zIndex: 999999
        });
      }
    } catch {
      // Ignorar si confetti falla
    }

    // 3. Despachar a la central (Supabase + Torre de Control) con la misma ubicación real
    try {
      const emergency = await triggerSos({
        sku: activeSku,
        cedula: currentQr?.holder?.cedula || 'V-00.000.000',
        phone: currentQr?.holder?.phone || 'Sin número',
        reporterType: safeRole,
        detectedCoords: coordsToUse
      });

      if (emergency) {
        setConfirmedEmergency(emergency);
      }
    } catch (err) {
      console.error('Error al despachar alerta S.O.S:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = (textToSend) => {
    const targetText = textToSend || chatMessage;
    if (!targetText || !targetText.trim() || !liveEmergency?.id) return;
    const senderName = currentQr?.holder?.name || (selectedRole === 'titular' ? 'Conductor Titular' : 'Testigo en Vía');
    sendEmergencyChatMessage(liveEmergency.id, targetText.trim(), 'usuario', senderName);
    setChatMessage('');
  };

  const handleClose = () => {
    setIsConfirmed(false);
    setConfirmedEmergency(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
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
              <ShieldAlert className="w-8 h-8 text-[#E53838]" />
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
                onClick={() => setSelectedRole('titular')}
                disabled={isSending}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm relative border-2 ${
                  selectedRole === 'titular'
                    ? 'border-[#532C8C] bg-purple-50/70 ring-2 ring-purple-300/30'
                    : 'border-slate-200 bg-white hover:bg-purple-50'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#532C8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-6 h-6 text-white" />
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
                {selectedRole === 'titular' && (
                  <div className="w-6 h-6 rounded-full bg-[#532C8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Opción 2: Soy un Tercero / Testigo */}
              <button
                type="button"
                onClick={() => setSelectedRole('tercero')}
                disabled={isSending}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm border-2 ${
                  selectedRole === 'tercero'
                    ? 'border-[#00A896] bg-teal-50/70 ring-2 ring-teal-300/30'
                    : 'border-slate-200 bg-white hover:bg-teal-50/70'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-teal-100 text-[#00A896] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-[#00A896]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-[14px]">Soy un tercero / testigo</div>
                  <div className="text-slate-500 text-[11.5px] leading-tight mt-0.5">
                    Acompañante, testigo o socorrista en la vía
                  </div>
                </div>
                {selectedRole === 'tercero' && (
                  <div className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                )}
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
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>TRANSMITIENDO A LA CENTRAL...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
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
          /* PANTALLA EN VIVO: SEGUIMIENTO EN TIEMPO REAL DEL DESPACHO */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
            {liveEmergency?.status === 'en_camino' ? (
              /* ESTADO B: ¡UNIDAD EN CAMINO! (Aprobado y despachado por el operador) */
              <>
                {/* Animación de Unidad Móvil Despachada */}
                <div className="relative flex items-center justify-center my-3">
                  <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-teal-400 opacity-40"></span>
                  <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#00A896] via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-xl shadow-teal-500/30 border-2 border-white">
                    <Truck className="w-10 h-10 animate-bounce text-white" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-1 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>¡Unidad en Ruta hacia ti!</span>
                </div>

                <h3 className="text-slate-900 font-black text-[20px] tracking-tight uppercase leading-tight">
                  ¡Auxilio Vial en Camino!
                </h3>
                <p className="text-slate-600 text-[12px] leading-snug mt-1 mb-2">
                  La Torre de Control ha coordinado y despachado la unidad para brindarte asistencia inmediata.
                </p>

                {/* Línea de Progreso Activa */}
                <div className="w-full grid grid-cols-3 gap-1 my-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">✓</div>
                    <span className="text-[9px] font-extrabold text-emerald-800 mt-1">Registrada</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">✓</div>
                    <span className="text-[9px] font-extrabold text-emerald-800 mt-1">Asignada</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-6 h-6 rounded-full bg-[#00A896] text-white flex items-center justify-center text-[11px] font-bold animate-pulse">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-extrabold text-teal-800 mt-1">En Ruta</span>
                  </div>
                </div>

                {/* Tarjeta de Detalles del Despacho */}
                <div className="w-full bg-teal-50/70 border border-teal-200 rounded-2xl p-3.5 text-left flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Folio Oficial:</span>
                    <span className="font-mono text-[12px] font-black text-[#532C8C] bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      {liveEmergency?.folio || confirmedEmergency?.folio || '#SOS-VENEZUELA'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 border-b border-teal-200/60 pb-2">
                    <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-4 h-4 text-[#00A896]" />
                    </div>
                    <div className="text-[11.5px] leading-tight">
                      <span className="font-bold text-slate-900 block">Recurso Despachado:</span>
                      <span className="font-black text-teal-900 text-xs">
                        {liveEmergency?.dispatchedUnit || 'Unidad Oficial de Auxilio Vial 24/7'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-[11.5px] leading-tight">
                      <span className="font-bold text-slate-900 block">Punto de Encuentro:</span>
                      <span className="text-slate-600 text-[11px]">{liveEmergency?.location?.address || 'Ubicación satelital transmitida'}</span>
                    </div>
                  </div>
                </div>

                {/* Caja de Recomendación de Seguridad */}
                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-left flex items-center gap-2 mt-2 text-amber-900 text-[11px]">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Enciende las luces intermitentes y mantente en un lugar seguro mientras llega la unidad.</span>
                </div>
              </>
            ) : liveEmergency?.status === 'resuelto' ? (
              /* ESTADO C: CASO RESUELTO */
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center my-3 border border-emerald-200 shadow-sm">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-slate-900 font-extrabold text-[19px] tracking-tight uppercase leading-tight">
                  ¡Asistencia Finalizada!
                </h3>
                <p className="text-slate-600 text-[12px] leading-snug mt-1 mb-3">
                  Tu auxilio vial ha sido atendido y marcado como resuelto por la Torre de Control. ¡Conduce con seguridad!
                </p>
              </>
            ) : (
              /* ESTADO A: ESPERANDO ASIGNACIÓN EN TORRE DE CONTROL (Radar en vivo) */
              <>
                {/* Animación de Radar Satelital Pulsante */}
                <div className="relative flex items-center justify-center my-3">
                  <span className="animate-ping absolute inline-flex h-24 w-24 rounded-full bg-purple-400 opacity-30"></span>
                  <span className="animate-pulse absolute inline-flex h-16 w-16 rounded-full bg-teal-300 opacity-50"></span>
                  <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#532C8C] to-[#00A896] text-white flex items-center justify-center shadow-xl shadow-purple-900/30 border-2 border-white">
                    <Radio className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-purple-100 text-[#532C8C] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-1 border border-purple-200">
                  <span className="w-2 h-2 rounded-full bg-[#532C8C] animate-ping"></span>
                  <span>Transmisión en Vivo a Torre 24/7</span>
                </div>

                <h3 className="text-slate-900 font-black text-[19px] tracking-tight uppercase leading-tight">
                  ¡Alerta en Monitoreo!
                </h3>
                <p className="text-slate-600 text-[12px] leading-snug mt-1 mb-2">
                  La Torre de Control 24/7 recibió tu señal. Un operador está coordinando la unidad más cercana.
                </p>

                {/* Barra de Fases en Espera */}
                <div className="w-full grid grid-cols-3 gap-1 my-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">✓</div>
                    <span className="text-[9px] font-extrabold text-emerald-800 mt-1">Registrada</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[11px] font-bold animate-pulse">⏳</div>
                    <span className="text-[9px] font-extrabold text-amber-800 mt-1">Coordinando</span>
                  </div>
                  <div className="flex flex-col items-center text-center opacity-40">
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[11px] font-bold">3</div>
                    <span className="text-[9px] font-extrabold text-slate-500 mt-1">En Ruta</span>
                  </div>
                </div>

                {/* Tarjeta de Datos en Espera */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folio Oficial:</span>
                    <span className="font-mono text-[12px] font-black text-[#532C8C] bg-purple-100 px-2 py-0.5 rounded-md">
                      {liveEmergency?.folio || confirmedEmergency?.folio || '#SOS-VENEZUELA'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Navigation className="w-3.5 h-3.5 text-[#00A896]" />
                    </div>
                    <div className="text-[11.5px] text-slate-700 leading-tight">
                      <span className="font-bold text-slate-900 block">Ubicación Satelital:</span>
                      <span className="text-slate-600 text-[11px]">{liveEmergency?.location?.address || confirmedEmergency?.location?.address || 'Ubicación satelital transmitida'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    </div>
                    <div className="text-[11.5px]">
                      <span className="font-bold text-slate-900">Estado: </span>
                      <span className="text-amber-600 font-extrabold uppercase animate-pulse">Esperando asignación de unidad</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* SECCIÓN DE CHAT EN VIVO BIDIRECCIONAL CON LA CENTRAL */}
            {/* ======================================================== */}
            {liveEmergency?.status !== 'resuelto' && (
              <div className="w-full mt-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left flex flex-col">
                {/* Cabecera del Chat Plegable */}
                <button
                  type="button"
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <MessageSquare className="w-4 h-4 text-teal-300" />
                    <span className="font-extrabold text-xs tracking-wide">
                      Chat en Vivo con la Central 24/7
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className="text-[10px] text-emerald-400 font-semibold">Operador activo</span>
                    {isChatExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isChatExpanded && (
                  <div className="p-2.5 flex flex-col gap-2 bg-slate-50/50">
                    {/* Lista de Mensajes / Bitácora */}
                    <div 
                      ref={chatScrollRef}
                      className="max-h-44 min-h-[100px] overflow-y-auto space-y-2 pr-1 text-xs"
                    >
                      {(!liveEmergency?.notes || liveEmergency.notes.length === 0) ? (
                        <div className="text-center text-slate-400 text-[11px] py-4 italic">
                          La Central está conectada. Escribe o usa las respuestas rápidas abajo.
                        </div>
                      ) : (
                        liveEmergency.notes.map((msg, idx) => {
                          const isUser = msg.sender === 'usuario';
                          const isCentral = msg.sender === 'central';

                          if (!isUser && !isCentral) {
                            // Nota del sistema
                            return (
                              <div key={msg.id || idx} className="text-center my-1">
                                <span className="bg-slate-200 text-slate-600 text-[9.5px] px-2 py-0.5 rounded-full inline-block font-medium">
                                  {msg.text}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={msg.id || idx} 
                              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                            >
                              <div className="text-[9.5px] text-slate-400 font-semibold mb-0.5 px-1 flex items-center gap-1">
                                <span>{isUser ? 'Tú' : '🛡️ Central 24/7'}</span>
                                <span>•</span>
                                <span>{msg.time}</span>
                              </div>
                              <div 
                                className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs shadow-xs leading-relaxed ${
                                  isUser 
                                    ? 'bg-gradient-to-r from-[#00A896] to-teal-600 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium'
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Botones de Respuestas Rápidas a 1 Toque */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {[
                        'Estoy orillado a la derecha',
                        'Tengo intermitentes encendidas',
                        'Ya veo llegar la unidad',
                        '¿Cuánto tiempo estimado?'
                      ].map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-[10.5px] px-2.5 py-1 rounded-xl whitespace-nowrap font-medium transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Caja de Entrada de Texto */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-1.5 mt-1"
                    >
                      <input 
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Escribe a la central..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00A896] shadow-inner"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim()}
                        className="bg-[#00A896] hover:bg-[#008677] disabled:opacity-40 text-white p-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Botón de Llamada Telefónica Directa de Emergencia */}
            <a
              href="tel:0800372836"
              className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Llamar Central Directo (0800-ESCUDO)</span>
            </a>

            {/* Botón Entendido / Mantener en Monitoreo */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full mt-2 bg-[#00A896] hover:bg-[#008677] text-white py-3 rounded-xl font-bold text-[12.5px] uppercase tracking-wider shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              {liveEmergency?.status === 'en_camino' ? 'ENTENDIDO / VER EN RUTA' : 'MANTENER EN ESPERA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  ArrowLeft,
  ChevronRight,
  Shield
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
  const [activeTab, setActiveTab] = useState('auxilio'); // 'auxilio' | 'chat'
  const [chatMessage, setChatMessage] = useState('');
  const chatScrollRef = useRef(null);

  // Obtener en tiempo real la emergencia activa vinculada a este folio o SKU
  const existingActiveEmg = (emergencies || []).find(e => 
    (confirmedEmergency?.id && e.id === confirmedEmergency.id) ||
    (confirmedEmergency?.folio && e.folio === confirmedEmergency.folio) ||
    (e.sku?.toUpperCase() === (activeSku || '').toUpperCase() && e.status !== 'resuelto')
  );
  const liveEmergency = existingActiveEmg || confirmedEmergency;

  const hasActiveEmergency = Boolean(
    (existingActiveEmg && existingActiveEmg.status !== 'resuelto') ||
    (confirmedEmergency && confirmedEmergency.status !== 'resuelto')
  );
  const showTrackingView = isConfirmed || hasActiveEmergency;

  // Filtrar notas válidas y no vacías
  const validNotes = (liveEmergency?.notes || []).filter(
    n => n && typeof n.text === 'string' && n.text.trim().length > 0
  );

  // Contar mensajes del chat para badge
  const chatMessagesCount = validNotes.filter(n => n.sender === 'central' || n.sender === 'usuario').length;

  // Auto-scroll al final del chat cuando entran nuevos mensajes
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [validNotes.length, activeTab]);

  // Al abrir el modal, capturar GPS y mostrar vista correspondiente
  useEffect(() => {
    if (isOpen) {
      setSelectedRole('titular');
      setIsSending(false);

      if (hasActiveEmergency) {
        setIsConfirmed(true);
        if (existingActiveEmg) {
          setConfirmedEmergency(existingActiveEmg);
        }
      } else {
        setIsConfirmed(false);
        setConfirmedEmergency(null);
      }

      setActiveTab('auxilio');
      setChatMessage('');

      // Detección silenciosa de GPS
      getDeviceLocation()
        .then((geo) => {
          if (geo) setDetectedGeo(geo);
        })
        .catch(() => {});
    }
  }, [isOpen, hasActiveEmergency]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) handleClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-4 sm:p-5 w-full max-w-sm sm:max-w-md flex flex-col items-center shadow-2xl relative border border-purple-100 max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {!showTrackingView ? (
          /* ======================================================== */
          /* PASO DIRECTO: SELECCIÓN DE QUIÉN REPORTA (TITULAR DEFAULT) */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center text-center overflow-y-auto">
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
              {/* Opción 1: Soy el Titular */}
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
          /* PANTALLA EN VIVO: MODAL CON PESTAÑAS (AUXILIO | CHAT 24/7) */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center h-full max-h-[85vh]">
            
            {/* Pestañas Superiores de Navegación Rápida */}
            {liveEmergency?.status !== 'resuelto' && (
              <div className="w-full bg-slate-100 p-1 rounded-2xl flex items-center mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('auxilio')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'auxilio'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#00A896]" />
                  <span>Estado del Auxilio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                    activeTab === 'chat'
                      ? 'bg-gradient-to-r from-[#532C8C] to-purple-800 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-teal-300" />
                  <span>Chat con Central</span>
                  {chatMessagesCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'chat' ? 'bg-emerald-500 text-white' : 'bg-[#532C8C] text-white'
                    }`}>
                      {chatMessagesCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* VISTA 1: ESTADO DEL AUXILIO (GRÚA EN CAMINO / RADAR) */}
            {activeTab === 'auxilio' ? (
              <div className="w-full flex flex-col items-center overflow-y-auto pr-0.5 text-center">
                {liveEmergency?.status === 'en_camino' ? (
                  /* ¡UNIDAD EN CAMINO! */
                  <>
                    <div className="relative flex items-center justify-center my-2">
                      <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-teal-400 opacity-40"></span>
                      <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#00A896] via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-xl shadow-teal-500/30 border-2 border-white">
                        <Truck className="w-9 h-9 text-white" />
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
                    <div className="w-full bg-teal-50/70 border border-teal-200 rounded-2xl p-3 text-left flex flex-col gap-2 mt-2">
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

                    {/* Banner Llamativo para Abrir el Chat Directo */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="w-full mt-2.5 bg-gradient-to-r from-[#532C8C] via-purple-800 to-[#532C8C] text-white p-3 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-teal-300">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs block">Abrir Chat con el Operador</span>
                          <span className="text-[10px] text-teal-300 font-semibold">Toca aquí para escribir a la central</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/80" />
                    </button>

                    {/* Recomendación de Seguridad */}
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-left flex items-center gap-2 mt-2 text-amber-900 text-[11px]">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Enciende las luces intermitentes y mantente en un lugar seguro mientras llega la unidad.</span>
                    </div>
                  </>
                ) : liveEmergency?.status === 'resuelto' ? (
                  /* CASO RESUELTO */
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
                  /* ESPERANDO EN TORRE DE CONTROL (Radar) */
                  <>
                    <div className="relative flex items-center justify-center my-2">
                      <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-purple-400 opacity-30"></span>
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

                    {/* Botón de Chat mientras espera */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="w-full mt-2 bg-gradient-to-r from-[#532C8C] to-purple-800 text-white p-3 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-teal-300">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs block">Escribir a la Central</span>
                          <span className="text-[10px] text-teal-300 font-semibold">Informa detalles o pide asistencia</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/80" />
                    </button>
                  </>
                )}

                {/* Botón de Llamada Telefónica Directa */}
                <a
                  href="tel:0800372836"
                  className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Llamar Central Directo (0800-ESCUDO)</span>
                </a>

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full mt-2 bg-[#00A896] hover:bg-[#008677] text-white py-3 rounded-xl font-bold text-[12.5px] uppercase tracking-wider shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  {liveEmergency?.status === 'en_camino' ? 'ENTENDIDO / VER EN RUTA' : 'MANTENER EN ESPERA'}
                </button>
              </div>
            ) : (
              /* VISTA 2: PANTALLA COMPLETA DE CHAT PROFESIONAL (ESTILO WHATSAPP/UBER) */
              <div className="w-full flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/80 rounded-2xl border border-slate-200 text-left">
                
                {/* Cabecera del Chat */}
                <div className="bg-[#532C8C] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('auxilio')}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/90 hover:text-white"
                      title="Volver a estado de grúa"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-teal-300">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-wide leading-tight">
                        Central de Monitoreo 24/7
                      </h4>
                      <p className="text-[10px] text-emerald-300 flex items-center gap-1 font-semibold leading-none mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Operador Alpha en línea
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-black bg-white/15 px-2 py-0.5 rounded-md text-white">
                    {liveEmergency?.folio || '#SOS-VENEZUELA'}
                  </span>
                </div>

                {/* Área de Mensajes */}
                <div 
                  ref={chatScrollRef}
                  className="flex-1 p-3 overflow-y-auto space-y-2.5 max-h-[46vh] min-h-[220px]"
                >
                  {validNotes.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-8 italic flex flex-col items-center gap-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <span>Canal seguro abierto. Escribe un mensaje o presiona una respuesta rápida abajo.</span>
                    </div>
                  ) : (
                    validNotes.map((msg, idx) => {
                      const isUser = msg.sender === 'usuario';
                      const isExplicitCentral = msg.sender === 'central';
                      const isSystem = !msg.sender && (
                        msg.text.includes('Alerta S.O.S') || 
                        msg.text.includes('Unidad despachada') || 
                        msg.text.includes('marcada como resuelta')
                      );
                      const isCentral = isExplicitCentral || (!isUser && !isSystem);

                      // Evento de Sistema (Píldora Centrada)
                      if (isSystem) {
                        return (
                          <div key={msg.id || idx} className="text-center my-1.5">
                            <span className="bg-slate-200/90 text-slate-600 text-[10px] px-2.5 py-1 rounded-full inline-block font-semibold shadow-2xs">
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      // Mensaje del Conductor (Derecha)
                      if (isUser) {
                        return (
                          <div key={msg.id || idx} className="flex flex-col items-end">
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 max-w-[85%] shadow-xs text-xs leading-relaxed font-medium">
                              {msg.text}
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-semibold mt-0.5 px-1">
                              {msg.time || 'Ahora'} • Tú
                            </span>
                          </div>
                        );
                      }

                      // Mensaje de la Central (Izquierda)
                      return (
                        <div key={msg.id || idx} className="flex flex-col items-start">
                          <div className="flex items-center gap-1 text-[9.5px] text-[#532C8C] font-extrabold mb-0.5 px-1">
                            <Shield className="w-3 h-3 text-[#532C8C]" />
                            <span>Central 24/7 • {msg.time || 'Ahora'}</span>
                          </div>
                          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2 max-w-[85%] shadow-xs text-xs leading-relaxed font-medium">
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Barra de Respuestas Rápidas */}
                <div className="bg-white/90 border-t border-slate-200 p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    '📍 Estoy orillado a la derecha',
                    '⚠️ Intermitentes encendidas',
                    '👀 Ya veo llegar la grúa',
                    '⏱️ ¿Cuánto tiempo estimado?'
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-[11px] px-2.5 py-1 rounded-xl whitespace-nowrap font-medium transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Caja de Redacción de Mensaje */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="bg-white p-2 border-t border-slate-200 flex items-center gap-2"
                >
                  <input 
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Escribe un mensaje a la central..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00A896] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="bg-[#00A896] hover:bg-[#008677] disabled:opacity-40 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                    title="Enviar mensaje"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

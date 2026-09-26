import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Car, 
  User, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Clock,
  Radio,
  X
} from 'lucide-react';

export default function IncomingEmergencyModal({ onAccepted }) {
  const { 
    unreadAlert, 
    setUnreadAlert, 
    soundEnabled, 
    setSoundEnabled, 
    updateEmergencyStatus 
  } = useApp();

  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  // Reproducir sirena repetitiva de emergencia táctica mientras el modal esté abierto
  useEffect(() => {
    if (!unreadAlert || unreadAlert.status !== 'critico' || !soundEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const playSirenTone = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Sirena bitonal de alta atención (880Hz -> 580Hz -> 880Hz)
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.35);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.7);

        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.75);
      } catch (err) {
        console.warn('Alarma sonora en espera de interacción:', err);
      }
    };

    // Tocar de inmediato y repetir cada 1.2 segundos
    playSirenTone();
    intervalRef.current = setInterval(playSirenTone, 1200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [unreadAlert, soundEnabled]);

  // Si no hay alerta crítica pendiente, no mostrar nada
  if (!unreadAlert || unreadAlert.status !== 'critico') {
    return null;
  }

  const handleAcceptAndDispatch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    updateEmergencyStatus(unreadAlert.id, 'en_camino', 'Unidad de Auxilio Vial');
    setUnreadAlert(null);
    if (onAccepted) onAccepted(unreadAlert.id);
  };

  const handleDismiss = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setUnreadAlert(null);
  };

  const mapsUrl = unreadAlert.location?.lat && unreadAlert.location?.lng
    ? `https://www.google.com/maps?q=${unreadAlert.location.lat},${unreadAlert.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unreadAlert.location?.address || 'Caracas, Venezuela')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Ventana Flotante Modal */}
      <div className="bg-white rounded-3xl w-full max-w-xl border-2 border-rose-500 shadow-2xl shadow-rose-950/60 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Cabecera de Alarma con Sirena Visual */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
                <h2 className="text-base font-black tracking-wide uppercase">
                  ¡NUEVA ALERTA S.O.S ENTRANTE!
                </h2>
              </div>
              <p className="text-[11px] text-white/90 font-medium">
                Atención inmediata requerida en Torre de Control 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Control Rápido de Sirena Sonora */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar sirena' : 'Activar sonido'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-white/20 text-white border-white/40 hover:bg-white/30' 
                  : 'bg-black/30 text-white/60 border-white/20 hover:bg-black/40'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Cerrar / Minimizar */}
            <button
              type="button"
              onClick={handleDismiss}
              title="Minimizar ventana al banner superior"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Detalles de la Emergencia */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          
          {/* Identificadores: Folio, SKU y Hora */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código Folio</span>
              <span className="font-mono font-extrabold text-lg text-rose-700">
                {unreadAlert.folio}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sticker QR</span>
              <span className="font-mono font-black text-xs text-[#532C8C] bg-purple-100/80 px-2.5 py-1 rounded-xl border border-purple-200">
                {unreadAlert.sku}
              </span>
            </div>
          </div>

          {/* Ficha del Titular y Reportante */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Titular Registrado
              </span>
              <span className="font-black text-slate-900 text-sm">{unreadAlert.holderName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/70 pb-2">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Cédula</span>
                <span className="font-bold text-slate-800 text-xs">{unreadAlert.cedula}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Reportado Por</span>
                <span className={`font-extrabold text-xs capitalize ${
                  unreadAlert.reporterType === 'titular' ? 'text-teal-700' : 'text-purple-700'
                }`}>
                  {unreadAlert.reporterType === 'titular' ? '👤 Titular' : '👥 Tercero / Testigo'}
                </span>
              </div>
            </div>

            <div className="border-b border-slate-200/70 pb-2">
              <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Vehículo / Placa</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mt-0.5">
                <Car className="w-4 h-4 text-[#532C8C]" />
                <span>{unreadAlert.vehicle || 'Vehículo en vía'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[9.5px] block">Ubicación GPS Detectada</span>
              <div className="flex items-start gap-1.5 text-slate-800 font-semibold text-xs mt-1">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{unreadAlert.location?.address || 'Ubicación reportada'}</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#532C8C] hover:text-purple-800 font-bold hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir coordenadas en Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Acciones de Contacto Rápido a 1 Clic */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${unreadAlert.phone}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20"
            >
              <Phone className="w-4 h-4" />
              <span>Llamar al Teléfono</span>
            </a>

            <a
              href={`https://wa.me/${unreadAlert.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${unreadAlert.holderName}, nos comunicamos desde la Central de Monitoreo de Escudo Vial 24/7 con respecto a tu alerta de emergencia ${unreadAlert.folio}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00A896] hover:bg-[#008677] text-white font-extrabold text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-700/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Directo</span>
            </a>
          </div>

          {/* BOTÓN PRINCIPAL GIGANTE: ACEPTAR Y ATENDER EMERGENCIA */}
          <button
            type="button"
            onClick={handleAcceptAndDispatch}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 active:scale-[0.98] text-white font-black text-sm sm:text-base py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/30 cursor-pointer uppercase tracking-wider"
          >
            <CheckCircle className="w-6 h-6 text-white" />
            <span>ACEPTAR Y ATENDER EMERGENCIA</span>
          </button>

          {/* Botón Secundario: Ver en el Radar */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-2 cursor-pointer transition-colors"
          >
            Ver en el Mapa Táctico sin cerrar caso
          </button>
        </div>
      </div>
    </div>
  );
}

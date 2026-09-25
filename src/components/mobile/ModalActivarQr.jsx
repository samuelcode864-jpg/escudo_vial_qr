import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';

export default function ModalActivarQr({ isOpen, onClose, targetSku: propSku }) {
  const { activeSku, currentQr, activateQr } = useApp();
  const effectiveSku = (propSku || activeSku || '').replace(/[#-]/g, '').toUpperCase();
  const isAlreadyActive = currentQr?.status === 'active';

  const [cedula, setCedula] = useState(currentQr?.holder?.cedula || '');
  const [telefono, setTelefono] = useState(currentQr?.holder?.phone || '');
  const [nombre, setNombre] = useState(currentQr?.holder?.name || '');
  const [vehiculo, setVehiculo] = useState(currentQr?.holder?.vehicle || '');
  const [placa, setPlaca] = useState(currentQr?.holder?.plate || '');
  const [bloodType, setBloodType] = useState(currentQr?.holder?.bloodType || 'O+');
  const [emergencyContact, setEmergencyContact] = useState(currentQr?.holder?.emergencyContactName || '');

  const [view, setView] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAlreadyActive) {
        setView('success');
      } else {
        setView('form');
      }
      if (currentQr?.holder) {
        setCedula(currentQr.holder.cedula || '');
        setTelefono(currentQr.holder.phone || '');
        setNombre(currentQr.holder.name || '');
        setVehiculo(currentQr.holder.vehicle || '');
        setPlaca(currentQr.holder.plate || '');
        setBloodType(currentQr.holder.bloodType || 'O+');
        setEmergencyContact(currentQr.holder.emergencyContactName || '');
      }
    }
  }, [isOpen, isAlreadyActive, currentQr]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      activateQr({
        sku: effectiveSku,
        cedula,
        phone: telefono,
        name: nombre,
        vehicle: vehiculo,
        plate: placa,
        bloodType,
        emergencyContact
      });

      setLoading(false);
      setView('success');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignorar si falla confetti
      }
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col shadow-2xl relative border border-teal-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {/* Botón Cerrar X */}
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {view === 'form' ? (
          /* VISTA 1: Formulario de Datos QR */
          <div className="flex flex-col w-full">
            {/* Cabecera del Modal Activa tu QR */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
                <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3 className="text-slate-900 font-extrabold text-[17px] leading-tight">Activa tu QR</h3>
                  <span className="bg-teal-100 text-[#00A896] font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    REGISTRO ÚNICO
                  </span>
                </div>
                <p className="text-slate-500 text-[12px] font-semibold mt-0.5">
                  SKU Detectado: <span className="font-mono text-[#532C8C] font-bold">{activeSku}</span>
                </p>
              </div>
            </div>

            {/* Descripción explicativa */}
            <p className="text-slate-600 text-[13px] mt-3 leading-snug bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Para vincular tu sticker físico y activar tu cobertura inmediata 24/7, por favor confirma tus datos.
            </p>

            {/* Formulario de Activación */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3.5">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5" htmlFor="qrNombreInput">
                  <span className="material-symbols-outlined text-[15px] text-[#00A896]">person</span>
                  <span>NOMBRE Y APELLIDO</span>
                </label>
                <input
                  id="qrNombreInput"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-[13px] font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896] focus:ring-1 focus:ring-[#00A896] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5" htmlFor="qrCedulaInput">
                  <span className="material-symbols-outlined text-[15px] text-[#00A896]">badge</span>
                  <span>NÚMERO DE CÉDULA</span>
                </label>
                <input
                  id="qrCedulaInput"
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej. V-12.345.678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-[13px] font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896] focus:ring-1 focus:ring-[#00A896] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5" htmlFor="qrTelefonoInput">
                  <span className="material-symbols-outlined text-[15px] text-[#00A896]">call</span>
                  <span>NÚMERO DE TELÉFONO</span>
                </label>
                <input
                  id="qrTelefonoInput"
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 0412 123 4567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-[13px] font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00A896] focus:ring-1 focus:ring-[#00A896] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#00A896]">directions_car</span>
                    <span>Vehículo</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculo}
                    onChange={(e) => setVehiculo(e.target.value)}
                    placeholder="Marca y Modelo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-[12px] font-medium focus:outline-none focus:border-[#00A896]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#00A896]">pin</span>
                    <span>Placa</span>
                  </label>
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    placeholder="Ej. AA123BB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-[12px] font-medium focus:outline-none focus:border-[#00A896]"
                  />
                </div>
              </div>

              {/* Ficha Médica y Contacto de Emergencia */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-rose-500">bloodtype</span>
                    <span>Tipo Sangre</span>
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-[12px] font-medium focus:outline-none focus:border-[#00A896]"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A-">A Negativo (A-)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#00A896]">contact_emergency</span>
                    <span>Contacto Familiar</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Ej. Valeria (Esposa)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-[12px] font-medium focus:outline-none focus:border-[#00A896]"
                  />
                </div>
              </div>

              {/* Botón CONTINUAR Y ACTIVAR */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[#00A896] hover:bg-[#008677] active:scale-[0.98] text-white font-extrabold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[19px] ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'sync' : 'verified_user'}
                </span>
                <span>{loading ? 'Verificando SKU y vinculando...' : 'CONTINUAR Y ACTIVAR'}</span>
              </button>

              {/* Botón / Link Hacerlo más tarde */}
              <button
                type="button"
                onClick={onClose}
                className="w-full text-slate-500 hover:text-slate-800 text-[12px] font-semibold py-1.5 transition-colors cursor-pointer text-center"
              >
                Hacerlo más tarde
              </button>
            </form>

            {/* Footer con Aviso de Protección de Datos */}
            <div className="mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[11px] text-center leading-tight">
              <span className="material-symbols-outlined text-[14px] text-slate-500 shrink-0">lock</span>
              <span>Tus datos están protegidos y vinculados a tu código SKU oficial de Escudo Vial.</span>
            </div>
          </div>
        ) : (
          /* VISTA 2: Confirmación y Éxito de Activación */
          <div className="flex flex-col items-center text-center w-full py-2">
            <div className="relative flex items-center justify-center w-20 h-20 mb-3">
              <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-60" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#00A896] to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 animate-success-pop">
                <span className="material-symbols-outlined text-[44px] font-bold">check</span>
              </div>
            </div>

            <span className="bg-teal-50 text-[#00A896] border border-teal-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A896] animate-pulse" />
              PROTECCIÓN ACTIVA
            </span>

            <h3 className="text-slate-900 font-extrabold text-[20px] tracking-tight leading-tight">
              ¡QR Activado con Éxito!
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-3 w-full text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU Vinculado</span>
                <span className="text-[12px] font-extrabold font-mono text-[#532C8C] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                  {activeSku}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Titular</span>
                <span className="text-[12px] font-bold text-slate-800">
                  {currentQr?.holder?.name || nombre}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cédula Titular</span>
                <span className="text-[12px] font-bold text-slate-800">
                  {currentQr?.holder?.cedula || cedula}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                <span className="text-[11px] font-extrabold text-teal-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified</span> Cobertura 24/7
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-[12px] mt-3 leading-snug">
              Tu sticker físico ha sido vinculado satisfactoriamente. En caso de incidente, cualquier persona u operador podrá socorrerte escaneando tu código.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full bg-[#00A896] hover:bg-[#008677] active:scale-[0.98] text-white font-extrabold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>ENTENDIDO</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

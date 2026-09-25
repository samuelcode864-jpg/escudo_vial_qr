import React, { useState } from 'react';

export default function MobileHeader({ onOpenReportModal }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md pt-safe border-b border-white/10 shadow-md bg-[#00A896]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Marca Institucional */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl overflow-hidden p-1 border border-white/20 shadow-inner flex items-center justify-center shrink-0 bg-[#532C8C]"
          >
            {/* Escudo Vial Icono SVG */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.07-7 10.18-3.87-1.11-7-5.51-7-10.18V6.3l7-3.12z" />
              <path d="M11 7h2v6h-2zm0 8h2v2h-2z" fill="#00A896" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-extrabold text-[15px] tracking-wide leading-tight drop-shadow-sm">
              ESCUDO VIAL
            </span>
            <span className="text-white/80 text-[11px] font-bold tracking-wider uppercase mt-0.5">
              Seguridad 24/7
            </span>
          </div>
        </div>

        {/* Botón de Menú Desplegable */}
        <div className="relative">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Menú de opciones"
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          {/* Menú Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-purple-100 p-2 z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menú</span>
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <a
                href="/panel"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#532C8C] hover:bg-purple-100/70 bg-purple-50/60 transition-colors text-[13px] font-bold group border border-purple-100"
              >
                <div className="w-7 h-7 rounded-lg bg-[#532C8C] text-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                </div>
                <span>Torre de Control / Panel</span>
              </a>

              <a
                href="#ayuda"
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); alert('Central de Soporte Escudo Vial disponible 24/7 al 01-8000-911-000'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-[#532C8C] hover:bg-purple-50 transition-colors text-[13px] font-bold group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#532C8C] flex items-center justify-center group-hover:bg-[#532C8C] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">help</span>
                </div>
                <span>Ayuda</span>
              </a>

              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenReportModal(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-[#532C8C] hover:bg-purple-50 transition-colors text-[13px] font-bold group text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#532C8C] flex items-center justify-center group-hover:bg-[#532C8C] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">report</span>
                </div>
                <span>Reporta a este conductor</span>
              </button>

              <a
                href="#faq"
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); alert('Preguntas frecuentes: El sticker QR es resistente a la intemperie y vincula tu póliza 24/7.'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-[#532C8C] hover:bg-purple-50 transition-colors text-[13px] font-bold group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#532C8C] flex items-center justify-center group-hover:bg-[#532C8C] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">quiz</span>
                </div>
                <span>Preguntas frecuentes</span>
              </a>

              <a
                href="#terminos"
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); alert('Términos y condiciones: Servicio de auxilio vial sujeto a cobertura geográfica.'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-[#532C8C] hover:bg-purple-50 transition-colors text-[13px] font-bold group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#532C8C] flex items-center justify-center group-hover:bg-[#532C8C] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                </div>
                <span>Términos y condiciones</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

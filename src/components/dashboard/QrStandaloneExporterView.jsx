import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  createStandaloneQrCanvas, 
  exportStandaloneQrPng, 
  exportBatchStandaloneQrZip, 
  exportBatchStandaloneQrPdf 
} from '../../utils/qrGenerator';
import { 
  Download, 
  FileText, 
  Archive, 
  Sliders, 
  CheckSquare, 
  Square, 
  Search, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers,
  Palette,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function QrStandaloneExporterView({ searchQuery = '' }) {
  const { qrList } = useApp();

  // Opciones de Configuración de Tamaño y Formato
  const [sizeCm, setSizeCm] = useState(8);
  const [darkColor, setDarkColor] = useState('#231749'); // Morado corporativo oficial
  const [transparentBg, setTransparentBg] = useState(false);
  const [showSkuFooter, setShowSkuFooter] = useState(false);

  // Modo de visualización: 'table' (compacta) o 'grid' (tarjetas)
  const [viewMode, setViewMode] = useState('table');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filtros
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedSkus, setSelectedSkus] = useState(new Set());
  const [previewSku, setPreviewSku] = useState(qrList[0]?.sku || 'EVAUTO0001');
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // Filtrado de códigos QR
  const filteredQrs = qrList.filter(q => {
    const cleanSku = (q.sku || '').replace(/[#-]/g, '').toUpperCase();
    const matchesSearch = cleanSku.includes(localSearch.toUpperCase()) ||
      (q.holder?.name || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (q.holder?.vehicle || '').toLowerCase().includes(localSearch.toLowerCase());

    const matchesCategory = filterCategory === 'all' || (q.category || 'Auto').toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(filteredQrs.length / pageSize));
  const paginatedQrs = filteredQrs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterStatus, localSearch, pageSize]);

  // Inicializar selección inicial y preview
  useEffect(() => {
    if (selectedSkus.size === 0 && filteredQrs.length > 0) {
      setSelectedSkus(new Set(filteredQrs.map(q => q.sku)));
    }
    if (!previewSku && filteredQrs.length > 0) {
      setPreviewSku(filteredQrs[0].sku);
    }
  }, [filteredQrs.length]);

  // Actualizar la vista previa interactiva en tiempo real al cambiar tamaño o diseño
  useEffect(() => {
    const targetSku = previewSku || (filteredQrs[0]?.sku) || 'EVAUTO0001';
    const cleanSku = targetSku.replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${window.location.origin}/v/${cleanSku}`;

    createStandaloneQrCanvas(cleanSku, targetUrl, sizeCm, {
      transparentBg,
      darkColor,
      showSkuFooter
    }).then(canvas => {
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    });
  }, [previewSku, sizeCm, darkColor, transparentBg, showSkuFooter]);

  // Manejadores de Selección
  const handleSelectAllFiltered = () => {
    if (selectedSkus.size === filteredQrs.length) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(filteredQrs.map(q => q.sku)));
    }
  };

  const handleSelectFirstN = (n) => {
    const firstN = filteredQrs.slice(0, n).map(q => q.sku);
    setSelectedSkus(new Set(firstN));
  };

  const toggleSelectSku = (sku) => {
    const next = new Set(selectedSkus);
    if (next.has(sku)) {
      next.delete(sku);
    } else {
      next.add(sku);
    }
    setSelectedSkus(next);
  };

  // Descargas Masivas
  const handleExportZip = async () => {
    const targetQrs = filteredQrs.filter(q => selectedSkus.has(q.sku));
    if (targetQrs.length === 0) {
      alert('Por favor selecciona al menos un código QR para exportar.');
      return;
    }

    setIsExportingZip(true);
    try {
      await exportBatchStandaloneQrZip(targetQrs, sizeCm, window.location.origin, {
        transparentBg,
        darkColor,
        showSkuFooter
      });
    } catch (err) {
      console.error('Error al exportar ZIP:', err);
      alert('Hubo un problema generando el archivo ZIP.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportPdf = async () => {
    const targetQrs = filteredQrs.filter(q => selectedSkus.has(q.sku));
    if (targetQrs.length === 0) {
      alert('Por favor selecciona al menos un código QR para imprimir.');
      return;
    }

    setIsExportingPdf(true);
    try {
      await exportBatchStandaloneQrPdf(targetQrs, sizeCm, window.location.origin, {
        transparentBg,
        darkColor,
        showSkuFooter
      });
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Hubo un problema generando el archivo PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyLink = (sku) => {
    const cleanSku = sku.replace(/[#-]/g, '').toUpperCase();
    const url = `${window.location.origin}/v/${cleanSku}`;
    navigator.clipboard.writeText(url);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1800);
  };

  const selectedCount = filteredQrs.filter(q => selectedSkus.has(q.sku)).length;
  const resolutionPx = Math.max(512, Math.round(sizeCm * 118));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. CABECERA Y PANEL DE CONFIGURACIÓN DEL QR PURO        */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-purple-100 text-[#532C8C]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Exportador de Códigos QR Puros
            </h2>
            <span className="bg-teal-50 text-[#00A896] text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
              Insignia Central "EV" Oficial
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Genera y exporta códigos QR limpios con el logo central de <b>Escudo Vial</b> en alta definición (300 DPI). 
            Configura el tamaño exacto en centímetros y descarga tanto individualmente como en lote para imprentas.
          </p>

          {/* Selector de Tamaños Presets y Personalizado */}
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Tamaño de Impresión / Exportación:</span>
            </div>

            {/* Botones de Tamaño Rápido */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { size: 4, label: '4x4 cm (Mini / Llavero)' },
                { size: 6, label: '6x6 cm (Moto / Compacto)' },
                { size: 8, label: '8x8 cm (Oficial Auto)', featured: true },
                { size: 10, label: '10x10 cm (Parabrisas)' },
                { size: 12, label: '12x12 cm (Camión / Carga)' },
              ].map(preset => (
                <button
                  key={preset.size}
                  type="button"
                  onClick={() => setSizeCm(preset.size)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    sizeCm === preset.size
                      ? 'bg-[#532C8C] text-white border-[#532C8C] shadow-sm shadow-purple-900/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Slider y Entrada Numérica Libre */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 max-w-xl">
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500 min-w-16">3 cm</span>
                <input 
                  type="range" 
                  min="3" 
                  max="20" 
                  step="0.5"
                  value={sizeCm}
                  onChange={(e) => setSizeCm(parseFloat(e.target.value))}
                  className="w-full accent-[#532C8C] cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-500 min-w-16 text-right">20 cm</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1 rounded-xl shadow-2xs">
                <input 
                  type="number" 
                  min="3" 
                  max="30" 
                  step="0.5"
                  value={sizeCm}
                  onChange={(e) => setSizeCm(Math.max(3, Math.min(30, parseFloat(e.target.value) || 8)))}
                  className="w-12 text-sm font-extrabold text-slate-900 outline-none text-center"
                />
                <span className="text-xs font-bold text-slate-400">cm</span>
              </div>

              <div className="hidden sm:flex flex-col text-right text-[10px] text-slate-500 border-l border-slate-200 pl-3">
                <span className="font-mono font-bold text-slate-800">{resolutionPx} × {resolutionPx} px</span>
                <span>Calidad 300 DPI Imprenta</span>
              </div>
            </div>

            {/* Opciones de Color y Acabado */}
            <div className="flex items-center gap-4 flex-wrap pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-400" /> Color:
                </span>
                <button
                  type="button"
                  onClick={() => setDarkColor('#231749')}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    darkColor === '#231749' ? 'scale-110 border-[#00A896] ring-2 ring-teal-300' : 'border-white'
                  }`}
                  style={{ backgroundColor: '#231749' }}
                  title="Morado Institucional (#231749)"
                />
                <button
                  type="button"
                  onClick={() => setDarkColor('#000000')}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    darkColor === '#000000' ? 'scale-110 border-[#00A896] ring-2 ring-teal-300' : 'border-white'
                  }`}
                  style={{ backgroundColor: '#000000' }}
                  title="Negro Puro (#000000)"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded border-slate-300 text-[#532C8C] focus:ring-[#532C8C] cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Fondo Transparente</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={showSkuFooter}
                  onChange={(e) => setShowSkuFooter(e.target.checked)}
                  className="rounded border-slate-300 text-[#532C8C] focus:ring-[#532C8C] cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Incluir SKU al pie</span>
              </label>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TARJETA DE VISTA PREVIA INTERACTIVA EN TIEMPO REAL      */}
        {/* ======================================================== */}
        <div className="w-full lg:w-72 bg-gradient-to-b from-slate-900 to-[#1e1438] p-4 rounded-3xl text-white flex flex-col items-center text-center shadow-lg border border-purple-500/20 shrink-0">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[10.5px] font-extrabold uppercase text-teal-400 tracking-wider">
              Vista Previa en Vivo
            </span>
            <span className="text-[10px] font-mono text-purple-200 bg-white/10 px-2 py-0.5 rounded-full">
              {sizeCm} × {sizeCm} cm
            </span>
          </div>

          {/* Imagen renderizada del QR puro con logo central */}
          <div className="w-48 h-48 bg-white/5 rounded-2xl p-2.5 flex items-center justify-center border border-white/10 shadow-inner relative group">
            {previewDataUrl ? (
              <img 
                src={previewDataUrl} 
                alt="Vista Previa QR Puro" 
                className="w-full h-full object-contain rounded-xl drop-shadow-md group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                Generando...
              </div>
            )}
          </div>

          <div className="mt-3 w-full">
            <div className="font-mono text-xs font-black tracking-wider text-teal-300 truncate">
              {previewSku}
            </div>
            <div className="text-[10px] text-white/70 mt-0.5">
              Escudo Vial • 300 DPI Vectorial
            </div>

            <button
              type="button"
              onClick={() => {
                const targetUrl = `${window.location.origin}/v/${previewSku}`;
                exportStandaloneQrPng(previewSku, targetUrl, sizeCm, {
                  transparentBg,
                  darkColor,
                  showSkuFooter
                });
              }}
              className="w-full mt-3 bg-[#00A896] hover:bg-[#008677] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar este QR (PNG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BARRA DE CONTROL DE LOTES, FILTROS Y VISTAS          */}
      {/* ======================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Filtros y Buscador */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar SKU, titular o placa..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#532C8C]"
              />
            </div>

            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 outline-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="auto">Solo Autos</option>
              <option value="moto">Solo Motos</option>
              <option value="camion">Solo Camiones</option>
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Vinculados</option>
              <option value="inactive">Solo Disponibles</option>
            </select>

            {/* Alternador de Vista: Tabla vs Cuadrícula */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Vista Tabla Compacta (Recomendada para 50+ QRs)"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-white text-[#532C8C] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista Cuadrícula de Tarjetas"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid' ? 'bg-white text-[#532C8C] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
            </div>
          </div>

          {/* Acciones de Descarga en Lote */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500 mr-1">
              <b>{selectedCount}</b> seleccionados de {filteredQrs.length}
            </span>

            {/* Botón Lote ZIP */}
            <button
              type="button"
              disabled={selectedCount === 0 || isExportingZip}
              onClick={handleExportZip}
              className="flex items-center gap-2 bg-[#532C8C] hover:bg-[#432172] text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-purple-900/20 cursor-pointer"
            >
              <Archive className={`w-4 h-4 ${isExportingZip ? 'animate-spin' : ''}`} />
              <span>{isExportingZip ? 'Comprimiendo...' : `Descargar ZIP (${selectedCount})`}</span>
            </button>

            {/* Botón Pliego PDF */}
            <button
              type="button"
              disabled={selectedCount === 0 || isExportingPdf}
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-[#00A896] hover:bg-[#008677] text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              <FileText className={`w-4 h-4 ${isExportingPdf ? 'animate-spin' : ''}`} />
              <span>{isExportingPdf ? 'Generando...' : `Planilla PDF (${selectedCount})`}</span>
            </button>
          </div>
        </div>

        {/* Barra de Selección Rápida de Lotes */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Selección rápida:</span>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[#532C8C] hover:underline font-bold cursor-pointer"
            >
              {selectedSkus.size === filteredQrs.length ? 'Deseleccionar todos' : 'Todos'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectFirstN(10)}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Primeros 10
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectFirstN(25)}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Primeros 25
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectFirstN(50)}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Primeros 50
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Mostrar por página:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. VISTA TABLA COMPACTA (ORGANIZADA PARA 50+ QRS)        */}
      {/* ======================================================== */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      {selectedSkus.size === filteredQrs.length && filteredQrs.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#532C8C]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">QR</th>
                  <th className="py-3 px-4">Código SKU</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Titular / Vehículo</th>
                  <th className="py-3 px-4 text-right">Descargas ({sizeCm}x{sizeCm} cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedQrs.map((qr) => {
                  const isSelected = selectedSkus.has(qr.sku);
                  const isPreviewing = previewSku === qr.sku;
                  const cleanSku = (qr.sku || '').replace(/[#-]/g, '').toUpperCase();
                  const targetUrl = `${window.location.origin}/v/${cleanSku}`;

                  return (
                    <tr
                      key={qr.sku}
                      onClick={() => setPreviewSku(qr.sku)}
                      className={`transition-colors cursor-pointer ${
                        isPreviewing 
                          ? 'bg-purple-50/40 font-medium' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectSku(qr.sku)}
                          className="cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#532C8C]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Miniatura del QR con logo central */}
                      <td className="py-2.5 px-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center relative shadow-2xs group">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(targetUrl)}&color=23-17-49&bgcolor=ffffff`}
                            alt={cleanSku}
                            className="w-full h-full object-contain rounded"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#00A896] border border-white flex items-center justify-center">
                              <span className="text-white text-[5px] font-black">EV</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{cleanSku}</span>
                          {isPreviewing && (
                            <span className="bg-purple-100 text-[#532C8C] text-[9px] font-black uppercase px-1 py-0.2 rounded">
                              Activo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
                          {qr.category || 'Auto'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                          qr.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${qr.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {qr.status === 'active' ? 'Vinculado' : 'Disponible'}
                        </span>
                      </td>

                      {/* Titular */}
                      <td className="py-3 px-4 text-slate-600">
                        {qr.holder?.name ? (
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs">{qr.holder.name}</span>
                            <span className="text-[10.5px] text-slate-400">{qr.holder.vehicle || 'Vehículo registrado'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin asignar (código libre)</span>
                        )}
                      </td>

                      {/* Acciones Individuales */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              exportStandaloneQrPng(cleanSku, targetUrl, sizeCm, {
                                transparentBg,
                                darkColor,
                                showSkuFooter
                              });
                            }}
                            title={`Descargar PNG individual de ${sizeCm}x${sizeCm} cm`}
                            className="bg-purple-50 hover:bg-[#532C8C] text-[#532C8C] hover:text-white py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PNG {sizeCm}cm</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(cleanSku)}
                            title="Copiar enlace directo"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedSku === cleanSku ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={`/v/${cleanSku}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir vista pública"
                            className="p-1.5 bg-slate-100 hover:bg-teal-50 hover:text-[#00A896] text-slate-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barra de Paginación */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
            <div>
              Mostrando <b>{Math.min(filteredQrs.length, (currentPage - 1) * pageSize + 1)}</b> a <b>{Math.min(filteredQrs.length, currentPage * pageSize)}</b> de <b>{filteredQrs.length}</b> códigos QR
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VISTA ALTERNATIVA EN CUADRÍCULA / TARJETAS (PAGINADA)    */
        /* ======================================================== */
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedQrs.map((qr) => {
              const isSelected = selectedSkus.has(qr.sku);
              const isPreviewing = previewSku === qr.sku;
              const cleanSku = (qr.sku || '').replace(/[#-]/g, '').toUpperCase();
              const targetUrl = `${window.location.origin}/v/${cleanSku}`;

              return (
                <div
                  key={qr.sku}
                  onClick={() => setPreviewSku(qr.sku)}
                  className={`bg-white rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                    isPreviewing 
                      ? 'border-[#532C8C] shadow-md ring-2 ring-purple-300/40 bg-purple-50/20' 
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectSku(qr.sku);
                      }}
                      className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#532C8C]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        qr.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {qr.status === 'active' ? 'Vinculado' : 'Disponible'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full aspect-square bg-slate-50 rounded-xl p-3 flex items-center justify-center border border-slate-100 relative group-hover:bg-purple-50/30 transition-colors">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}&color=23-17-49&bgcolor=ffffff`}
                        alt={cleanSku}
                        className="w-full h-full object-contain rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-[#00A896] border-2 border-white flex items-center justify-center shadow-xs">
                          <span className="text-white text-[9.5px] font-black tracking-tight">EV</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-900 tracking-wider">
                        {cleanSku}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {qr.category || 'Auto'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {qr.holder?.name || 'Sticker sin asignar'}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportStandaloneQrPng(cleanSku, targetUrl, sizeCm, {
                          transparentBg,
                          darkColor,
                          showSkuFooter
                        });
                      }}
                      className="flex-1 bg-purple-50 hover:bg-[#532C8C] text-[#532C8C] hover:text-white py-1.5 px-2 rounded-lg text-[10.5px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>PNG {sizeCm}cm</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(cleanSku);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedSku === cleanSku ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={`/v/${cleanSku}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-slate-100 hover:bg-teal-50 hover:text-[#00A896] text-slate-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación para Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
            <div>
              Página <b>{currentPage}</b> de <b>{totalPages}</b> ({filteredQrs.length} códigos en total)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredQrs.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 flex flex-col items-center">
          <Layers className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron códigos QR con estos filtros</h3>
          <p className="text-xs text-slate-400 mt-1">Intenta cambiar la búsqueda o restablecer los filtros de categoría.</p>
        </div>
      )}
    </div>
  );
}

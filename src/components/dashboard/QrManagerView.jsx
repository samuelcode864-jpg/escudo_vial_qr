import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  createStickerCanvas, 
  exportBatchToZip, 
  exportBatchToPdf,
  generateQrPng
} from '../../utils/qrGenerator';
import { 
  QrCode, 
  Layers, 
  Download, 
  Printer, 
  FileText, 
  Smartphone, 
  Filter, 
  Plus, 
  Car, 
  CheckCircle2, 
  Sparkles,
  Wifi,
  ExternalLink,
  Copy,
  Check,
  Search,
  Tag,
  Link2,
  Eye,
  User,
  Phone,
  ShieldCheck,
  HeartPulse,
  Info,
  Calendar
} from 'lucide-react';

export default function QrManagerView({ searchQuery = '', onGoToExporter }) {
  const { qrList, createBatchQrs, generateNewQr, setActiveSku } = useApp();

  const [selectedSku, setSelectedSku] = useState(qrList[0]?.sku || 'EV8842VE');
  const [filterType, setFilterType] = useState('todos');
  const [selectedSizeCm, setSelectedSizeCm] = useState(8); // 5, 8, 12 cm
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);
  const [selectedHolderModal, setSelectedHolderModal] = useState(null);

  // Modales
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);

  // QRs Llenos vs Vacíos
  const activeQrs = qrList.filter(q => q.status === 'active');
  const inactiveQrs = qrList.filter(q => q.status !== 'active');

  // Datos para creación por lote
  const [batchCount, setBatchCount] = useState(20);
  const [batchPrefix, setBatchPrefix] = useState('EV2026');
  const [batchCategory, setBatchCategory] = useState('Auto');

  // Datos para creación individual
  const [singleSkuInput, setSingleSkuInput] = useState('');
  const [singleCategory, setSingleCategory] = useState('Auto');

  const canvasRef = useRef(null);
  const currentQr = qrList.find(q => q.sku.toUpperCase() === selectedSku.toUpperCase()) || qrList[0] || null;

  // Determinar la URL base dinámica y oficial (siempre el dominio activo)
  const getBaseUrl = () => {
    return window.location.origin;
  };

  const targetQrUrl = currentQr ? `${getBaseUrl()}/v/${currentQr.sku}` : '';

  // Dibujar el sticker real en el canvas cada vez que cambie el SKU o tamaño
  useEffect(() => {
    let isCancelled = false;
    async function renderCanvas() {
      if (!currentQr || !canvasRef.current) return;
      try {
        const generatedCanvas = await createStickerCanvas(currentQr.sku, targetQrUrl, selectedSizeCm);
        if (!isCancelled && canvasRef.current) {
          const mainCtx = canvasRef.current.getContext('2d');
          canvasRef.current.width = generatedCanvas.width;
          canvasRef.current.height = generatedCanvas.height;
          mainCtx.clearRect(0, 0, generatedCanvas.width, generatedCanvas.height);
          mainCtx.drawImage(generatedCanvas, 0, 0);
        }
      } catch (err) {
        console.error("Error al renderizar canvas QR:", err);
      }
    }
    renderCanvas();
    return () => { isCancelled = true; };
  }, [currentQr, targetQrUrl, selectedSizeCm]);

  const filteredQrs = qrList.filter(q => {
    const matchesSearch = !searchQuery || (
      q.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.holder?.name && q.holder.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.cedula && q.holder.cedula.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.vehicle && q.holder.vehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.plate && q.holder.plate.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const matchesFilter = filterType === 'todos' || q.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCopyLink = (sku) => {
    const url = `${getBaseUrl()}/v/${sku}`;
    navigator.clipboard.writeText(url);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleExportZip = async () => {
    if (filteredQrs.length === 0) {
      alert("No hay stickers para exportar. Genera al menos uno.");
      return;
    }
    setIsExporting(true);
    try {
      await exportBatchToZip(filteredQrs, selectedSizeCm, getBaseUrl());
    } catch (e) {
      alert("Error al exportar ZIP: " + e.message);
    }
    setIsExporting(false);
  };

  const handleExportPdf = async () => {
    if (filteredQrs.length === 0) {
      alert("No hay stickers para generar PDF. Genera al menos uno.");
      return;
    }
    setIsExporting(true);
    try {
      await exportBatchToPdf(filteredQrs, selectedSizeCm, getBaseUrl());
    } catch (e) {
      alert("Error al generar PDF: " + e.message);
    }
    setIsExporting(false);
  };

  const handleDownloadSinglePng = () => {
    if (!canvasRef.current || !currentQr) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `Sticker_EscudoVial_${currentQr.sku}_${selectedSizeCm}x${selectedSizeCm}cm.png`;
    a.click();
  };

  const handlePrintCurrent = () => {
    if (!canvasRef.current || !currentQr) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Sticker - ${currentQr.sku}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; font-family: sans-serif; }
            .sticker-card { text-align: center; }
            img { width: ${selectedSizeCm}cm; height: ${selectedSizeCm}cm; border-radius: 12px; }
            @media print {
              body { background: white; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <img src="${dataUrl}" />
            <p class="no-print" style="margin-top: 15px; font-weight: bold; color: #532C8C;">
              Sticker oficial Escudo Vial (${selectedSizeCm} x ${selectedSizeCm} cm)
            </p>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCreateBatch = (e) => {
    e.preventDefault();
    const created = createBatchQrs(Number(batchCount), batchPrefix.trim().toUpperCase(), batchCategory);
    if (created && created.length > 0) {
      setSelectedSku(created[0].sku);
      setShowBatchModal(false);
      alert(`¡Lote de ${created.length} stickers QR creado exitosamente!`);
    }
  };

  const handleCreateSingle = (e) => {
    e.preventDefault();
    const skuToUse = singleSkuInput.trim() ? singleSkuInput.trim().toUpperCase() : null;
    const created = generateNewQr(skuToUse, singleCategory);
    if (created) {
      setSelectedSku(created.sku);
      setSingleSkuInput('');
      setShowSingleModal(false);
      alert(`¡Sticker individual ${created.sku} creado exitosamente y disponible en el catálogo!`);
    } else {
      alert('Ese código SKU ya se encuentra registrado en el sistema.');
    }
  };

  return (
    <div className="flex flex-col gap-5 mt-4">
      {/* Barra de Acciones Principales y Creación de QRs */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#532C8C] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              CENTRO DE GESTIÓN Y CATÁLOGO DE QRS
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Genera códigos individuales o por lote, exporta para imprenta y consulta a qué pantalla y vehículo dirige cada sticker.
          </p>
        </div>

        {/* Botones de Creación */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowSingleModal(true)}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>+ Generar QR Individual</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="flex-1 md:flex-none bg-[#00A896] hover:bg-[#008677] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Generar Lote Masivo</span>
          </button>

          {onGoToExporter && (
            <button
              type="button"
              onClick={onGoToExporter}
              className="flex-1 md:flex-none bg-purple-50 hover:bg-[#532C8C] text-[#532C8C] hover:text-white border border-purple-200 hover:border-[#532C8C] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar QRs Puros (Sin Marco)</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna Izquierda: Visor del Sticker Físico Real, Destino y Acciones (4 Columnas) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {currentQr ? (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sticker Seleccionado
                  </span>
                  <span className="text-sm font-mono text-[#532C8C] font-extrabold">
                    {currentQr.sku}
                  </span>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  currentQr.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {currentQr.status === 'active' ? '● VINCULADO 24/7' : '○ EN STOCK'}
                </span>
              </div>

              {/* Selector de Tamaño del Troquel */}
              <div className="w-full mt-3 flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-600 pl-1">Tamaño:</span>
                <div className="flex items-center gap-1">
                  {[
                    { cm: 5, label: '5x5 cm' },
                    { cm: 8, label: '8x8 cm' },
                    { cm: 12, label: '12x12 cm' },
                  ].map(sz => (
                    <button
                      key={sz.cm}
                      type="button"
                      onClick={() => setSelectedSizeCm(sz.cm)}
                      className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                        selectedSizeCm === sz.cm
                          ? 'bg-[#532C8C] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dominio Oficial Activo */}
              <div className="w-full mt-2 flex items-center justify-between bg-teal-50/70 p-2.5 rounded-2xl border border-teal-100 text-xs">
                <div className="flex items-center gap-1.5 text-[#008677] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Enlace Oficial en la Nube:</span>
                </div>
                <span className="font-mono text-[11px] text-[#532C8C] font-extrabold truncate max-w-[200px]" title={window.location.origin}>
                  {window.location.origin}
                </span>
              </div>

              {/* RENDERIZADO DEL STICKER REAL EN CANVAS */}
              <div className="my-4 relative group flex flex-col items-center">
                <div className="p-2 bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-800">
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: selectedSizeCm === 5 ? '190px' : selectedSizeCm === 8 ? '240px' : '270px',
                      height: selectedSizeCm === 5 ? '190px' : selectedSizeCm === 8 ? '240px' : '270px',
                    }}
                    className="rounded-2xl transition-all duration-300"
                  />
                </div>
              </div>

              {/* Ficha Explicativa: A dónde dirige este QR */}
              <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-[#532C8C]" />
                    A dónde dirige este QR:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(currentQr.sku)}
                    className="text-[11px] font-bold text-[#00A896] hover:text-[#008677] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSku === currentQr.sku ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-extrabold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Enlace</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80 break-all select-all font-semibold">
                  {targetQrUrl}
                </div>

                <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {currentQr.status === 'active' ? (
                    <span>
                      👉 Dirige a la <strong>pantalla protegida</strong> del vehículo <strong>{currentQr.holder?.vehicle?.replace(/\s*\([^)]*\)\s*$/, '')} ({currentQr.holder?.plate || 'S/P'})</strong> a nombre de <strong>{currentQr.holder?.name}</strong>.
                    </span>
                  ) : (
                    <span>
                      👉 Dirige a la <strong>pantalla de activación</strong> para que el nuevo usuario registre su vehículo y datos de emergencia con el sticker <strong>{currentQr.sku}</strong>.
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Acción del Sticker Individual */}
              <div className="w-full grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={handlePrintCurrent}
                  className="bg-[#532C8C] hover:bg-[#432172] text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Sticker</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSinglePng}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-300" />
                  <span>Bajar PNG (300DPI)</span>
                </button>
              </div>

              <a
                href={targetQrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full bg-[#00A896] hover:bg-[#008677] text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Abrir Pantalla del Botón (Pestaña Nueva)</span>
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#532C8C] flex items-center justify-center mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Sin Stickers en Inventario</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                Actualmente no hay códigos QR registrados en el catálogo. Genera uno individual o un lote masivo para comenzar.
              </p>
              <div className="flex flex-col gap-2 w-full mt-5">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(true)}
                  className="w-full bg-[#00A896] hover:bg-[#008677] active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Generar Lote Masivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSingleModal(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-400" />
                  <span>+ Generar QR Individual</span>
                </button>
              </div>
            </div>
          )}

          {/* Exportación Masiva para Imprenta */}
          <div className="bg-gradient-to-br from-purple-950 via-[#532C8C] to-[#432172] rounded-3xl p-5 text-white shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wider uppercase text-teal-300 flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                Exportación Masiva
              </span>
              <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded text-white/90">
                {filteredQrs.length} stickers
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Descarga todos los stickers filtrados en el tamaño seleccionado ({selectedSizeCm}x{selectedSizeCm} cm) para imprenta comercial.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportZip}
                className="bg-white/15 hover:bg-white/25 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 text-teal-300" />
                <span>{isExporting ? 'Generando...' : 'Descargar ZIP'}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPdf}
                className="bg-[#00A896] hover:bg-[#008677] active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pliego PDF (A4)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Catálogo General de Códigos QR (8 Columnas) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* 3 Tarjetas KPI de Resumen de Inventario */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: QRs Llenos / Entregados */}
            <div 
              onClick={() => setFilterType('active')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                filterType === 'active' 
                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20' 
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  QRs Llenos / Entregados
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {activeQrs.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Conductor y vehículo registrado 24/7
              </p>
            </div>

            {/* Card 2: QRs en Stock / Por Llenar */}
            <div 
              onClick={() => setFilterType('inactive')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                filterType === 'inactive' 
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20' 
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  Generados en Stock (Sin Llenar)
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {inactiveQrs.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Listos para imprimir y entregar a usuarios
              </p>
            </div>

            {/* Card 3: Total Códigos */}
            <div 
              onClick={() => setFilterType('todos')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                filterType === 'todos' 
                  ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20' 
                  : 'bg-white border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold text-[#532C8C] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Total en Inventario
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#532C8C] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {qrList.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {qrList.length > 0 ? `${Math.round((activeQrs.length / qrList.length) * 100)}% de stickers vinculados` : 'Sin stickers'}
              </p>
            </div>
          </div>

          {/* Barra de Filtros y Pestañas Destacadas */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setFilterType('active')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  filterType === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>QRs Entregados / Llenos</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterType === 'active' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeQrs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('inactive')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  filterType === 'inactive'
                    ? 'bg-[#532C8C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Generados en Stock (Sin Llenar)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterType === 'inactive' ? 'bg-purple-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {inactiveQrs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('todos')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  filterType === 'todos'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>Ver Todos</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterType === 'todos' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {qrList.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-semibold shrink-0">
              Mostrando {filteredQrs.length} de {qrList.length} stickers
            </div>
          </div>

          {/* Tabla / Directorio General de QRs Adaptativa */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                  <tr className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Código SKU</th>
                    {filterType === 'active' ? (
                      <>
                        <th className="py-3 px-4">Conductor Titular</th>
                        <th className="py-3 px-4">Vehículo & Placa</th>
                        <th className="py-3 px-4">Contacto de Auxilio</th>
                        <th className="py-3 px-4">Estado</th>
                      </>
                    ) : filterType === 'inactive' ? (
                      <>
                        <th className="py-3 px-4">Enlace de Activación</th>
                        <th className="py-3 px-4">Tipo de Troquel</th>
                        <th className="py-3 px-4">Estado en Stock</th>
                        <th className="py-3 px-4">Fecha Creación</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4">Enlace de Destino</th>
                        <th className="py-3 px-4">Vehículo / Titular</th>
                        <th className="py-3 px-4">Escaneos</th>
                        <th className="py-3 px-4">Estado</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredQrs.map((qr) => {
                    const isSelected = selectedSku.toUpperCase() === qr.sku.toUpperCase();
                    const isActive = qr.status === 'active';
                    const linkUrl = `${getBaseUrl()}/v/${qr.sku}`;

                    return (
                      <tr 
                        key={qr.sku}
                        onClick={() => setSelectedSku(qr.sku)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50/90 font-semibold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Columna SKU */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-extrabold text-slate-900 text-sm">
                            {qr.sku}
                          </div>
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            {qr.category || 'Auto'}
                          </span>
                        </td>

                        {/* VISTA 1: QRs Entregados / Llenos */}
                        {filterType === 'active' ? (
                          <>
                            {/* Titular */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#532C8C]" />
                                <span>{qr.holder?.name || 'Usuario Escudo Vial'}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                Cédula: {qr.holder?.cedula || 'V-00.000.000'}
                              </span>
                            </td>

                            {/* Vehículo y Placa */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-[#00A896]" />
                                <span>{qr.holder?.vehicle?.replace(/\s*\([^)]*\)\s*$/, '') || 'Vehículo registrado'}</span>
                              </div>
                              <span className="font-mono font-extrabold text-[#532C8C] bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-100 mt-0.5 inline-block">
                                {qr.holder?.plate || 'S/P'}
                              </span>
                            </td>

                            {/* Contacto de Auxilio */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-800 font-semibold">
                                {qr.holder?.emergencyContactName || 'Familiar Registrado'}
                              </div>
                              {qr.holder?.emergencyContactPhone && (
                                <a
                                  href={`tel:${qr.holder.emergencyContactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{qr.holder.emergencyContactPhone}</span>
                                </a>
                              )}
                            </td>

                            {/* Estado Activo */}
                            <td className="py-3.5 px-4">
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Protegido 24/7
                              </span>
                            </td>
                          </>
                        ) : filterType === 'inactive' ? (
                          <>
                            {/* Enlace Destino de Activación */}
                            <td className="py-3.5 px-4 max-w-[220px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-[#532C8C] font-bold truncate block">
                                  /v/{qr.sku}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(qr.sku);
                                  }}
                                  className="p-1 text-slate-400 hover:text-[#00A896] rounded transition-colors"
                                  title="Copiar URL de activación"
                                >
                                  {copiedSku === qr.sku ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                Dirige a pantalla de registro para nuevo cliente
                              </span>
                            </td>

                            {/* Tipo de Troquel */}
                            <td className="py-3.5 px-4">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs">
                                Troquel {qr.category || 'Auto'}
                              </span>
                            </td>

                            {/* Estado en Stock */}
                            <td className="py-3.5 px-4">
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                <Tag className="w-3 h-3 text-amber-600" />
                                En Stock (Disponible)
                              </span>
                            </td>

                            {/* Fecha de Creación */}
                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                              {qr.createdAt ? new Date(qr.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'Hoy'}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Vista Todos: Enlace de Destino */}
                            <td className="py-3.5 px-4 max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="font-mono text-[11px] text-slate-600 truncate block hover:text-[#532C8C]"
                                  title={linkUrl}
                                >
                                  /v/{qr.sku}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(qr.sku);
                                  }}
                                  className="p-1 text-slate-400 hover:text-[#00A896] rounded transition-colors"
                                  title="Copiar URL completa"
                                >
                                  {copiedSku === qr.sku ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {linkUrl}
                              </span>
                            </td>

                            {/* Vehículo / Titular */}
                            <td className="py-3.5 px-4">
                              {isActive && qr.holder ? (
                                <div>
                                  <div className="flex items-center gap-1 font-extrabold text-slate-900">
                                    <Car className="w-3.5 h-3.5 text-[#532C8C]" />
                                    <span>{qr.holder.vehicle?.replace(/\s*\([^)]*\)\s*$/, '')} ({qr.holder.plate || 'S/P'})</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {qr.holder.name} • {qr.holder.phone}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-amber-500" />
                                  En stock (Sin llenar)
                                </span>
                              )}
                            </td>

                            {/* Escaneos */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                {qr.scansCount || 0}
                              </span>
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isActive 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isActive ? '● Lleno 24/7' : '○ En Stock'}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isActive && qr.holder && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHolderModal(qr);
                                }}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#00A896] transition-colors"
                                title="Ver Ficha Completa del Conductor"
                              >
                                <User className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSku(qr.sku);
                              }}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#532C8C] transition-colors"
                              title="Ver e imprimir troquel físico"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Abrir destino en nueva pestaña"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Estado Vacío */}
                  {filteredQrs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {filterType === 'active' ? (
                          <div className="max-w-md mx-auto">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-extrabold text-sm text-slate-700">No hay QRs llenados por conductores todavía</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Los stickers generados que aún no tienen datos aparecen en la pestaña <strong>"Generados en Stock (Sin Llenar)"</strong>. Tan pronto un usuario escanee su sticker y registre su vehículo, aparecerá inmediatamente aquí.
                            </p>
                          </div>
                        ) : filterType === 'inactive' ? (
                          <div className="max-w-md mx-auto">
                            <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-extrabold text-sm text-slate-700">No hay stickers en stock disponibles</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Todos los stickers generados ya fueron entregados, o aún no has creado un lote para imprenta.
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <button
                                type="button"
                                onClick={() => setShowBatchModal(true)}
                                className="bg-[#00A896] hover:bg-[#008677] active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Lote Masivo
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowSingleModal(true)}
                                className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Individual
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-md mx-auto">
                            <QrCode className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-extrabold text-sm text-slate-700">No hay stickers QR disponibles</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Actualmente no hay stickers en el catálogo. Genera tu primer lote o un QR individual para comenzar.
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <button
                                type="button"
                                onClick={() => setShowBatchModal(true)}
                                className="bg-[#00A896] hover:bg-[#008677] active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Lote Masivo
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowSingleModal(true)}
                                className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Individual
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Crear QR Individual */}
      {showSingleModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSingleModal(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-purple-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-600" />
                  Crear Código QR Individual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Genera un único sticker con un SKU personalizado o automático.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSingleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSingle} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    Código SKU (Identificador Único)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setSingleSkuInput(`EV${rand}VE`);
                    }}
                    className="text-[10px] text-[#00A896] hover:underline font-bold"
                  >
                    🎲 Autogenerar
                  </button>
                </div>
                <input
                  type="text"
                  value={singleSkuInput}
                  onChange={(e) => setSingleSkuInput(e.target.value)}
                  placeholder="Ej. EV8990VE (o dejar vacío para autogenerar)"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:border-[#532C8C]"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Tipo de Vehículo Destino
                </label>
                <select
                  value={singleCategory}
                  onChange={(e) => setSingleCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#532C8C]"
                >
                  <option value="Auto">Automóvil / Sedán / SUV</option>
                  <option value="Moto">Motocicleta / Casco</option>
                  <option value="Camión">Carga Pesada / Autobús</option>
                </select>
              </div>

              {/* Vista previa de enlace que tendrá */}
              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-900 text-xs">
                <span className="font-bold block text-[10px] uppercase text-purple-600">Enlace que codificará el sticker:</span>
                <code className="text-[11px] font-mono break-all mt-0.5 block">
                  {getBaseUrl()}/v/{singleSkuInput.trim().toUpperCase() || 'EVXXXXVE'}
                </code>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#532C8C] hover:bg-[#432172] active:scale-95 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Crear QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Crear Lote Masivo */}
      {showBatchModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBatchModal(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-purple-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00A896]" />
                  Generar Lote Masivo de QRs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crea secuencias consecutivas de códigos para imprimir en pliegos de stickers físicos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Cantidad de Stickers a Generar
                </label>
                <select
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-[#532C8C]"
                >
                  <option value={10}>10 stickers (Prueba rápida)</option>
                  <option value={25}>25 stickers (Pliego pequeño)</option>
                  <option value={50}>50 stickers (Pliego estándar)</option>
                  <option value={100}>100 stickers (Lote comercial)</option>
                  <option value={200}>200 stickers (Gran volumen)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Prefijo de Código SKU
                </label>
                <input
                  type="text"
                  required
                  value={batchPrefix}
                  onChange={(e) => setBatchPrefix(e.target.value)}
                  placeholder="Ej. EV2026"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:border-[#532C8C]"
                />
                <span className="text-[10px] text-slate-400">
                  Se generarán como: <code>{batchPrefix}0001</code>, <code>{batchPrefix}0002</code>...
                </span>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Categoría de Vehículo
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#532C8C]"
                >
                  <option value="Auto">Automóvil / SUV / Camioneta</option>
                  <option value="Moto">Motocicleta / Casco</option>
                  <option value="Camión">Carga Pesada / Autobús</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00A896] hover:bg-[#008677] active:scale-95 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Crear e Incorporar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Ficha Completa del Conductor / QR Lleno */}
      {selectedHolderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedHolderModal(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative border border-emerald-100 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      Ficha Oficial de Seguridad Vial
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Activo 24/7
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Sticker SKU: <span className="font-bold text-[#532C8C]">{selectedHolderModal.sku}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHolderModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Datos del Titular y Vehículo */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conductor Titular</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedHolderModal.holder?.name || 'Usuario Escudo Vial'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-200/60 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cédula de Identidad</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.cedula || 'V-00.000.000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teléfono Conductor</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.phone || 'Sin número'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-200/60 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehículo / Modelo</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.vehicle || 'Vehículo Particular'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Placa del Vehículo</span>
                    <span className="font-mono font-extrabold text-[#532C8C] bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-100 inline-block mt-0.5">
                      {selectedHolderModal.holder?.plate || 'S/P'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Sangre</span>
                    <span className="font-extrabold text-rose-600 text-xs mt-0.5 block">
                      🩸 {selectedHolderModal.holder?.bloodType || 'O+'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Póliza Escudo Vial</span>
                    <span className="font-semibold text-slate-700 text-xs mt-0.5 block truncate">
                      {selectedHolderModal.holder?.insurancePolicy || `Póliza 24/7 #${selectedHolderModal.sku}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Contacto de Auxilio Familiar */}
              <div className="bg-teal-50 p-3.5 rounded-2xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Contacto Familiar de Auxilio</span>
                  <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                    {selectedHolderModal.holder?.emergencyContactName || 'Familiar Registrado'}
                  </div>
                  <div className="text-[11px] text-teal-800 font-mono mt-0.5">
                    {selectedHolderModal.holder?.emergencyContactPhone || selectedHolderModal.holder?.phone}
                  </div>
                </div>

                {selectedHolderModal.holder?.emergencyContactPhone && (
                  <a
                    href={`tel:${selectedHolderModal.holder.emergencyContactPhone}`}
                    className="bg-[#00A896] hover:bg-[#008677] text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamar</span>
                  </a>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <a
                href={`${getBaseUrl()}/v/${selectedHolderModal.sku}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#532C8C] hover:bg-[#432172] text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Abrir Botón S.O.S del Usuario</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setSelectedSku(selectedHolderModal.sku);
                  setSelectedHolderModal(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Ver Troquel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

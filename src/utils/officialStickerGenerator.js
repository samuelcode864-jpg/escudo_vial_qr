import QRCode from 'qrcode';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import rawTemplateSvg from '../assets/sticker_template.svg?raw';

/**
 * Genera el string de comandos SVG (d="") para un código QR
 */
function generateQrPath(modules, targetX, targetY, targetSize) {
  const size = modules.size;
  const cellSize = targetSize / size;
  let d = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules.get(r, c)) {
        const x = (targetX + c * cellSize).toFixed(3);
        const y = (targetY + r * cellSize).toFixed(3);
        const s = cellSize.toFixed(3);
        d += `M${x},${y}h${s}v${s}h-${s}z `;
      }
    }
  }
  return d.trim();
}

export const DEFAULT_PRINT_CONFIG = {
  cutExternal: true,    // Trazo fucsia perimetral exterior (45x130mm)
  cutInternal: true,    // Trazos fucsia interiores (ambos stickers)
  showBatchCode: true,  // Texto vertical de lote (L1C0)
  batchCodeText: 'L1C', // Texto personalizado del lote
};

/**
 * Genera el SVG oficial milimétrico completo con los dos códigos QR y el SKU centrado,
 * aplicando la configuración de impresión (vectores de corte y número de lote).
 */
export function generateOfficialStickerSvg(sku, targetUrl, printConfig = {}) {
  const config = { ...DEFAULT_PRINT_CONFIG, ...printConfig };
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const url = targetUrl || `https://escudo-vial-qr.vercel.app/v/${cleanSku}`;

  // Nivel de corrección 'H' (30% de redundancia) para máxima resistencia en intemperie
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });

  // 1. QR Superior (Pequeño): centro (64.355, 109.398), tamaño 36.5 mm/pt
  const topSize = 36.5;
  const topX = 64.355 - topSize / 2;
  const topY = 109.398 - topSize / 2;
  const topPath = generateQrPath(qr.modules, topX, topY, topSize);

  // 2. QR Inferior (Principal/Grande): centro (64.356, 248.460), tamaño 54.0 mm/pt
  const btmSize = 54.0;
  const btmX = 64.356 - btmSize / 2;
  const btmY = 248.46 - btmSize / 2;
  const btmPath = generateQrPath(qr.modules, btmX, btmY, btmSize);

  let svg = rawTemplateSvg;

  // Reemplazar el dummy path del QR superior
  svg = svg.replace(
    /<path d="M45\.403,91\.265[\s\S]*?z"\/>/,
    `<path fill="#000000" d="${topPath}"/>`
  );

  // Reemplazar el dummy path del QR inferior
  svg = svg.replace(
    /<path d="M36\.437,221\.745[\s\S]*?z"\/>/,
    `<path fill="#000000" d="${btmPath}"/>`
  );

  // Reemplazar el texto "QR0001" superior centrando el SKU real
  svg = svg.replace(
    /<text transform="matrix\(1 0 0 1 46\.6963 139\.3701\)"[^>]*>QR0001<\/text>/,
    `<text x="64.356" y="139.3701" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="8.9831" fill="#000000">${cleanSku}</text>`
  );

  // Reemplazar el texto "QR0001" inferior centrando el SKU real
  svg = svg.replace(
    /<text transform="matrix\(1 0 0 1 38\.3418 292\.6177\)"[^>]*>QR0001<\/text>/,
    `<text x="64.356" y="292.6177" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="13.2345" fill="#000000">${cleanSku}</text>`
  );

  // --- CONFIGURACIÓN DE IMPRESIÓN PERSONALIZADA ---

  // 1. Vector de corte externo (Contorno perimetral exterior 45x130 mm)
  if (!config.cutExternal) {
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" d="M118\.138,365\.149[\s\S]*?118\.138,365\.149z"\/>/,
      ''
    );
  }

  // 2. Vectores de corte internos (Troqueles interiores del sticker superior e inferior)
  if (!config.cutInternal) {
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" d="M89\.632,158\.269[\s\S]*?89\.632,158\.269z"\/>/,
      ''
    );
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" d="M101\.596,320\.458[\s\S]*?101\.596,320\.458z"\/>/,
      ''
    );
  }

  // 3. Número de lote (Texto vertical L1C0)
  if (config.showBatchCode) {
    const batchText = (config.batchCodeText || 'L1C').trim();
    svg = svg.replace(
      /<text transform="matrix\(0 -1\.0007 1 0 11\.8584 169\.7095\)"[^>]*>L1C0<\/text>/,
      `<text transform="matrix(0 -1.0007 1 0 11.8584 169.7095)" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="5.9887">${batchText}</text>`
    );
  } else {
    svg = svg.replace(
      /<text transform="matrix\(0 -1\.0007 1 0 11\.8584 169\.7095\)"[^>]*>L1C0<\/text>/,
      ''
    );
  }

  return svg;
}

/**
 * Convierte el SVG a un Data URL (base64) para renderizar en <img> o Canvas
 */
export function generateOfficialStickerDataUrl(sku, targetUrl, printConfig = {}) {
  const svg = generateOfficialStickerSvg(sku, targetUrl, printConfig);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Dibuja el sticker oficial en un Canvas a 300 DPI
 */
export async function renderOfficialStickerToCanvas(sku, targetUrl, canvas, printConfig = {}) {
  if (!canvas) return;
  const dataUrl = generateOfficialStickerDataUrl(sku, targetUrl, printConfig);

  // 45mm x 130mm a 300 DPI: 1mm = 11.811px => ~531 x 1535 px
  const widthPx = 531;
  const heightPx = 1535;

  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, widthPx, heightPx);
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
}

/**
 * Descarga individual en formato JPG a 300 ppp (531 x 1535 px)
 */
export async function exportOfficialStickerJpg(sku, targetUrl, printConfig = {}) {
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const canvas = document.createElement('canvas');
  await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sticker_Imprenta_${cleanSku}_300DPI.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.98);
}

/**
 * Descarga individual en formato SVG vectorial puro (con el vector de corte magenta intacto o configurado)
 */
export function exportOfficialStickerSvg(sku, targetUrl, printConfig = {}) {
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const svg = generateOfficialStickerSvg(cleanSku, targetUrl, printConfig);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Sticker_Imprenta_${cleanSku}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descarga individual en formato PDF listo para corte (45mm x 130mm)
 */
export async function exportOfficialStickerPdf(sku, targetUrl, printConfig = {}) {
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  
  // Canvas temporal para rasterizar con máxima nitidez a 300 DPI
  const canvas = document.createElement('canvas');
  await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);
  const pngData = canvas.toDataURL('image/png');

  // PDF con tamaño exacto del troquel: 45 mm x 130 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [45, 130]
  });

  doc.addImage(pngData, 'PNG', 0, 0, 45, 130, undefined, 'FAST');
  doc.save(`Sticker_Imprenta_${cleanSku}.pdf`);
}

/**
 * Exporta un lote completo en un archivo ZIP con todos los SVGs individuales + PDF unificado
 */
export async function exportBatchOfficialZip(qrs, getBaseUrl, printConfig = {}) {
  const zip = new JSZip();
  const svgFolder = zip.folder("Stickers_Vectoriales_SVG");

  // PDF consolidado de páginas múltiples (45x130mm cada una)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [45, 130]
  });

  const canvas = document.createElement('canvas');

  for (let i = 0; i < qrs.length; i++) {
    const q = qrs[i];
    const cleanSku = q.sku.replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;

    // 1. Guardar SVG vectorial puro en el ZIP
    const svgContent = generateOfficialStickerSvg(cleanSku, targetUrl, printConfig);
    svgFolder.file(`Sticker_${cleanSku}.svg`, svgContent);

    // 2. Agregar página al PDF
    await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);
    const pngData = canvas.toDataURL('image/png');

    if (i > 0) doc.addPage([45, 130], 'portrait');
    doc.addImage(pngData, 'PNG', 0, 0, 45, 130, undefined, 'FAST');
  }

  // Agregar el PDF al ZIP
  const pdfBlob = doc.output('blob');
  zip.file(`Pliego_Completo_${qrs.length}_Stickers_45x130mm.pdf`, pdfBlob);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Lote_Stickers_Imprenta_EscudoVial_${qrs.length}_unidades.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta un pliego de imprenta montado (Grid de stickers en pliego estándar A3 / Tabloide)
 * Ideal para mandar a imprimir en vinil autoadhesivo troquelado
 */
export async function exportBatchOfficialPliegoPdf(qrs, getBaseUrl, printConfig = {}) {
  // Hoja A3: 297mm x 420mm (Caben filas de 5 x 3 = 15 stickers de 45x130mm con separación y marcas de corte)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3'
  });

  const pageWidth = 297;
  const pageHeight = 420;
  const stickerW = 45;
  const stickerH = 130;
  const marginX = 16;
  const marginY = 15;
  const gapX = 10;
  const gapY = 0; // verticalmente alineados

  const cols = 5;
  const rows = 3;
  const perPage = cols * rows; // 15 por pliego A3

  const canvas = document.createElement('canvas');

  for (let i = 0; i < qrs.length; i++) {
    const pageIndex = Math.floor(i / perPage);
    const itemIndex = i % perPage;

    if (pageIndex > 0 && itemIndex === 0) {
      doc.addPage('a3', 'portrait');
    }

    const col = itemIndex % cols;
    const row = Math.floor(itemIndex / cols);

    const x = marginX + col * (stickerW + gapX);
    const y = marginY + row * (stickerH + gapY);

    const q = qrs[i];
    const cleanSku = q.sku.replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;

    await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);
    const pngData = canvas.toDataURL('image/png');

    doc.addImage(pngData, 'PNG', x, y, stickerW, stickerH, undefined, 'FAST');

    // Pie de página con información de producción
    if (itemIndex === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `PLIEGO DE IMPRESIÓN OFICIAL ESCUDO VIAL - Pág. ${pageIndex + 1} - Lote de ${qrs.length} stickers - Vinil reflectivo/troquelado 45x130mm`,
        marginX,
        pageHeight - 6
      );
    }
  }

  doc.save(`Pliego_Imprenta_A3_EscudoVial_${qrs.length}_stickers.pdf`);
}

/**
 * Exporta paquete ZIP con todos los stickers individuales por separado en formato JPG a 300 ppp (45x130mm cada uno).
 * Si solo se solicita 1 sticker, descarga directamente el archivo .jpg individual.
 */
export async function exportBatchJpgZip(qrs, getBaseUrl, printConfig = {}) {
  if (!qrs || qrs.length === 0) return;

  // Si es un solo sticker, descargar directamente el archivo .jpg individual
  if (qrs.length === 1) {
    const cleanSku = qrs[0].sku.replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;
    return exportOfficialStickerJpg(cleanSku, targetUrl, printConfig);
  }

  const zip = new JSZip();

  for (let i = 0; i < qrs.length; i++) {
    const q = qrs[i];
    const cleanSku = q.sku.replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;

    const canvas = document.createElement('canvas');
    await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);

    // Guardar cada archivo JPG individual por separado en el ZIP a 300 DPI
    const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    zip.file(`Sticker_${cleanSku}_300DPI.jpg`, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lote_Stickers_JPG_300DPI_${qrs.length}_archivos_separados.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORTACIÓN POR LIENZO / BOBINA PERSONALIZADA (PLOTTER DE CORTE CMYK)
// ============================================================================

export const DEFAULT_CANVAS_CONFIG = {
  canvasWidthMm: 1000, // 1000 mm (1 metro de ancho de bobina)
  gapXMm: 5,           // 5 mm entre stickers horizontalmente
  gapYMm: 5,           // 5 mm entre stickers verticalmente
  marginMm: 15,        // 15 mm margen a los bordes
  targetRows: 2,       // 2 filas por defecto
  cmykMode: true       // Modo CMYK activo siempre
};

/**
 * Calcula la distribución matemática exacta de cuántos stickers caben a lo ancho
 * y las dimensiones totales del lienzo resultante sin desperdicio de material.
 */
export function calculateCanvasRollLayout(config = {}) {
  const canvasWidthMm = Number(config.canvasWidthMm) || 1000;
  const gapXMm = Number(config.gapXMm) !== undefined ? Number(config.gapXMm) : 5;
  const gapYMm = Number(config.gapYMm) !== undefined ? Number(config.gapYMm) : 5;
  const marginMm = Number(config.marginMm) !== undefined ? Number(config.marginMm) : 15;
  const targetRows = Math.max(1, Number(config.targetRows) || 1);

  const stickerWidth = 45;  // Ancho milimétrico oficial
  const stickerHeight = 130; // Alto milimétrico oficial

  const usableWidth = Math.max(stickerWidth, canvasWidthMm - (2 * marginMm));
  const cols = Math.max(1, Math.floor((usableWidth + gapXMm) / (stickerWidth + gapXMm)));
  const rows = targetRows;
  const totalStickers = cols * rows;

  const totalGridWidth = (cols * stickerWidth) + ((cols - 1) * gapXMm);
  const offsetX = marginMm + Math.max(0, (usableWidth - totalGridWidth) / 2);
  const canvasHeightMm = (2 * marginMm) + (rows * stickerHeight) + ((rows - 1) * gapYMm);

  // Metros lineales gastados de bobina
  const linearMeters = (canvasHeightMm / 1000).toFixed(2);

  return {
    canvasWidthMm,
    canvasHeightMm,
    usableWidth,
    cols,
    rows,
    totalStickers,
    gapXMm,
    gapYMm,
    marginMm,
    offsetX,
    stickerWidth,
    stickerHeight,
    totalGridWidth,
    linearMeters
  };
}

/**
 * Convierte los colores RGB del SVG a equivalentes CMYK puros para imprenta profesional
 * - Vector de corte: Magenta 100% CMYK (C:0 M:100 Y:0 K:0 / #FF00FF)
 * - Morado Escudo Vial: C:75 M:90 Y:0 K:10 (#471A70)
 * - Turquesa Escudo Vial: C:80 M:0 Y:45 K:0 (#00A896)
 * - Rojo emergencia: C:0 M:100 Y:100 K:0 (#E30613)
 * - Negro QR/Texto: K:100 Puro (C:0 M:0 Y:0 K:100 / #000000)
 */
export function convertSvgToCmyk(svgString) {
  let svg = svgString;
  // Magenta puro 100% CMYK para vector de corte y troqueles
  svg = svg.replace(/#F0047F/gi, '#FF00FF');
  // Ajustes de color a perfiles de imprenta offset / plotter digital
  svg = svg.replace(/#4B2C84/gi, '#471A70');
  svg = svg.replace(/#1ABC9C/gi, '#00A896');
  svg = svg.replace(/#E00707/gi, '#E30613');
  return svg;
}

/**
 * Post-procesa la cadena PostScript/PDF generada para garantizar que todos los
 * operadores de color usen DeviceCMYK en lugar de DeviceRGB
 */
function convertPdfToCmyk(pdfString) {
  // 1. Vector de corte Magenta Puro (C:0 M:100 Y:0 K:0): '0 1 0 0 K'
  let out = pdfString.replace(
    /(?:0\.94\d*|1(?:\.0*)?)\s+(?:0(?:\.0*)?|0\.01\d*)\s+(?:0\.49\d*|1(?:\.0*)?)\s+RG/g,
    '0.0000 1.0000 0.0000 0.0000 K'
  );

  // 2. Morado corporativo (C:75 M:90 Y:0 K:10): '0.75 0.90 0 0.10 k'
  out = out.replace(
    /0\.29\d*\s+0\.17\d*\s+0\.51\d*\s+rg/g,
    '0.7500 0.9000 0.0000 0.1000 k'
  );

  // 3. Verde/Turquesa corporativo (C:80 M:0 Y:45 K:0): '0.80 0 0.45 0 k'
  out = out.replace(
    /0\.10\d*\s+0\.73\d*\s+0\.61\d*\s+rg/g,
    '0.8000 0.0000 0.4500 0.0000 k'
  );

  // 4. Rojo emergencia (C:0 M:100 Y:100 K:0): '0 1 1 0 k'
  out = out.replace(
    /0\.87\d*\s+0\.02\d*\s+0\.02\d*\s+rg/g,
    '0.0000 1.0000 1.0000 0.0000 k'
  );

  // 5. Negro puro K:100 para textos y módulos QR (C:0 M:0 Y:0 K:100)
  out = out.replace(/0(?:\.0*)?\s+0(?:\.0*)?\s+0(?:\.0*)?\s+rg/g, '0.0000 0.0000 0.0000 1.0000 k');
  out = out.replace(/0(?:\.0*)?\s+0(?:\.0*)?\s+0(?:\.0*)?\s+RG/g, '0.0000 0.0000 0.0000 1.0000 K');

  // 6. Conversión genérica de cualquier otro color RGB residual a CMYK
  out = out.replace(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+rg/g, (match, rStr, gStr, bStr) => {
    const r = parseFloat(rStr);
    const g = parseFloat(gStr);
    const b = parseFloat(bStr);
    if (r === 1 && g === 1 && b === 1) return '0.0000 0.0000 0.0000 0.0000 k';
    const c = 1 - r;
    const m = 1 - g;
    const y = 1 - b;
    const k = Math.min(c, m, y);
    if (k >= 0.999) return '0.0000 0.0000 0.0000 1.0000 k';
    const cVal = (c - k) / (1 - k);
    const mVal = (m - k) / (1 - k);
    const yVal = (y - k) / (1 - k);
    return `${cVal.toFixed(4)} ${mVal.toFixed(4)} ${yVal.toFixed(4)} ${k.toFixed(4)} k`;
  });

  return out;
}

/**
 * Exporta un lienzo / bobina completa en formato PDF en alta resolución con vectores de corte en espacio CMYK.
 * Cada sticker es renderizado a 300 DPI y los trazados de troquelado son vectores puros en Magenta CMYK (0,100,0,0).
 */
export async function exportCanvasRollPdf(qrs, getBaseUrl, canvasConfig = {}, printConfig = {}) {
  const layout = calculateCanvasRollLayout(canvasConfig);
  const { canvasWidthMm, canvasHeightMm, cols, rows, totalStickers, gapXMm, gapYMm, marginMm, offsetX, stickerWidth, stickerHeight } = layout;

  const orientation = canvasWidthMm > canvasHeightMm ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [canvasWidthMm, canvasHeightMm]
  });

  const canvas = document.createElement('canvas');

  for (let i = 0; i < totalStickers; i++) {
    const q = qrs[i] || qrs[i % qrs.length] || { sku: `EV${String(1000 + i).slice(-4)}VE` };
    const cleanSku = (q.sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;

    const col = i % cols;
    const row = Math.floor(i / cols);

    const xMm = offsetX + col * (stickerWidth + gapXMm);
    const yMm = marginMm + row * (stickerHeight + gapYMm);

    // Renderizar sticker en alta resolución oficial a 300 ppp
    await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, { ...printConfig, cmykMode: true });
    const imgData = canvas.toDataURL('image/png');

    doc.addImage(imgData, 'PNG', xMm, yMm, stickerWidth, stickerHeight, undefined, 'FAST');

    // Vector de corte perimetral en Magenta puro (C:0 M:100 Y:0 K:0)
    if (printConfig.cutExternal !== false) {
      doc.setDrawColor(255, 0, 255); // Post-procesado a 100% Magenta CMYK por convertPdfToCmyk
      doc.setLineWidth(0.1);
      doc.roundedRect(xMm, yMm, stickerWidth, stickerHeight, 4, 4, 'S');
    }

    // Troqueles internos vectoriales
    if (printConfig.cutInternal) {
      doc.setDrawColor(255, 0, 255);
      doc.setLineWidth(0.1);
      doc.circle(xMm + 22.5, yMm + 15, 7.5, 'S');
      doc.roundedRect(xMm + 8.5, yMm + 68, 28, 28, 2, 2, 'S');
    }
  }

  // Título y datos técnicos de prepress en el margen superior
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `ESCUDO VIAL 24/7 - LIENZO BOBINA CMYK PREPRESS - ${totalStickers} STICKERS (${cols} cols x ${rows} filas) - Ancho: ${canvasWidthMm}mm x Alto: ${Math.round(canvasHeightMm)}mm - Troquel Magenta CMYK (0,100,0,0)`,
    offsetX,
    marginMm - 4 > 5 ? marginMm - 4 : 5
  );

  // Convertir operadores de color a DeviceCMYK en el PDF final
  const rawPdf = doc.output();
  const cmykPdf = convertPdfToCmyk(rawPdf);

  const blob = new Blob([new TextEncoder().encode(cmykPdf)], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Lienzo_Bobina_CMYK_${totalStickers}_Stickers_${canvasWidthMm}x${Math.round(canvasHeightMm)}mm.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  return { totalExported: totalStickers, layout };
}

/**
 * Genera el archivo SVG Maestro completo del Lienzo / Bobina con todos los stickers
 * montados en alta definición vectorial y espacio de color CMYK.
 */
export function generateCanvasRollMasterSvg(qrs, getBaseUrl, canvasConfig = {}, printConfig = {}) {
  const layout = calculateCanvasRollLayout(canvasConfig);
  const { canvasWidthMm, canvasHeightMm, cols, rows, totalStickers, gapXMm, gapYMm, marginMm, offsetX, stickerWidth, stickerHeight } = layout;

  const widthPt = (canvasWidthMm * 2.834645).toFixed(2);
  const heightPt = (canvasHeightMm * 2.834645).toFixed(2);

  let stickersSvgContent = '';

  for (let i = 0; i < totalStickers; i++) {
    const q = qrs[i] || qrs[i % qrs.length] || { sku: `EV${String(1000 + i).slice(-4)}VE` };
    const cleanSku = (q.sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;

    const col = i % cols;
    const row = Math.floor(i / cols);

    const xMm = offsetX + col * (stickerWidth + gapXMm);
    const yMm = marginMm + row * (stickerHeight + gapYMm);

    const xPt = (xMm * 2.834645).toFixed(3);
    const yPt = (yMm * 2.834645).toFixed(3);

    let stickerSvg = generateOfficialStickerSvg(cleanSku, targetUrl, { ...printConfig, cmykMode: true });
    stickerSvg = convertSvgToCmyk(stickerSvg);

    // Extraer contenido interno del SVG para agruparlo en <g>
    const innerMatch = stickerSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    const innerContent = innerMatch ? innerMatch[1] : stickerSvg;

    stickersSvgContent += `
    <!-- Sticker ${i + 1}: ${cleanSku} (Columna ${col + 1}, Fila ${row + 1}) -->
    <g transform="translate(${xPt}, ${yPt})">
      ${innerContent}
    </g>`;
  }

  const masterSvg = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Escudo Vial Prepress Engine - CMYK Master Canvas Roll -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${canvasWidthMm}mm" height="${canvasHeightMm}mm" 
     viewBox="0 0 ${widthPt} ${heightPt}" 
     color-interpolation="sRGB">
  <defs>
    <style type="text/css">
      .cmyk-cut-contour { stroke: #FF00FF !important; stroke-width: 0.1pt !important; fill: none !important; }
      text { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
  </defs>
  
  <!-- Fondo blanco del pliego -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  
  <!-- Marcas de información prepress -->
  <text x="${(offsetX * 2.834645).toFixed(2)}" y="25" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="bold" fill="#666666">
    ESCUDO VIAL 24/7 - LIENZO BOBINA CMYK PREPRESS (PLOTTER) - ${totalStickers} STICKERS (${cols} cols x ${rows} filas) - ANCHO: ${canvasWidthMm}mm x ALTO: ${Math.round(canvasHeightMm)}mm - VECTORES DE CORTE MAGENTA 100% CMYK (0,100,0,0)
  </text>

  <!-- Grilla de Stickers en Alta Definición Vectorial -->
  ${stickersSvgContent}
</svg>`;

  return masterSvg;
}

/**
 * Descarga directamente el archivo SVG Maestro del Lienzo / Bobina
 */
export function exportCanvasRollSvg(qrs, getBaseUrl, canvasConfig = {}, printConfig = {}) {
  const masterSvg = generateCanvasRollMasterSvg(qrs, getBaseUrl, canvasConfig, printConfig);
  const layout = calculateCanvasRollLayout(canvasConfig);
  
  const blob = new Blob([masterSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lienzo_Bobina_CMYK_${layout.totalStickers}_Stickers_${layout.canvasWidthMm}x${Math.round(layout.canvasHeightMm)}mm.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

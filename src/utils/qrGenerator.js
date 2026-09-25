import QRCode from 'qrcode';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/**
 * Genera el DataURL en PNG del código QR puro
 */
export async function generateQrPng(url, width = 600) {
  return await QRCode.toDataURL(url, {
    width,
    margin: 2,
    color: {
      dark: '#1e1b4b', // deep purple
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H' // Alto nivel para permitir logo central o raspaduras en el sticker
  });
}

/**
 * Dibuja un sticker físico completo de alta resolución en un elemento Canvas
 */
export async function createStickerCanvas(sku, targetUrl, sizeCm = 8) {
  // 300 DPI: 1 cm ≈ 118 px. Para 8x8 cm => ~944 x 944 px
  const pxSize = Math.round(sizeCm * 118);
  const canvas = document.createElement('canvas');
  canvas.width = pxSize;
  canvas.height = pxSize;
  const ctx = canvas.getContext('2d');

  // 1. Fondo del Sticker con esquinas redondeadas
  const radius = pxSize * 0.12;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(pxSize - radius, 0);
  ctx.quadraticCurveTo(pxSize, 0, pxSize, radius);
  ctx.lineTo(pxSize, pxSize - radius);
  ctx.quadraticCurveTo(pxSize, pxSize, pxSize - radius, pxSize);
  ctx.lineTo(radius, pxSize);
  ctx.quadraticCurveTo(0, pxSize, 0, pxSize - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // Gradiente corporativo Escudo Vial
  const grad = ctx.createLinearGradient(0, 0, 0, pxSize);
  grad.addColorStop(0, '#532C8C');
  grad.addColorStop(0.5, '#432172');
  grad.addColorStop(1, '#321657');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pxSize, pxSize);

  // 2. Línea de borde reflectivo institucional
  ctx.strokeStyle = '#68CFC2';
  ctx.lineWidth = Math.max(3, pxSize * 0.015);
  ctx.stroke();

  // 3. Cabecera Institucional
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(pxSize * 0.065)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ESCUDO VIAL', pxSize / 2, pxSize * 0.10);

  ctx.fillStyle = '#68CFC2';
  ctx.font = `700 ${Math.round(pxSize * 0.032)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('SEGURIDAD & AUXILIO 24/7', pxSize / 2, pxSize * 0.145);

  // 4. Contenedor Blanco del QR
  const qrBoxSize = pxSize * 0.58;
  const qrBoxX = (pxSize - qrBoxSize) / 2;
  const qrBoxY = pxSize * 0.18;
  const qrRadius = qrBoxSize * 0.08;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius);
  ctx.fill();

  // 5. Dibujar el código QR
  const qrPngUrl = await generateQrPng(targetUrl, qrBoxSize * 0.92);
  const qrImg = new Image();
  await new Promise((resolve) => {
    qrImg.onload = resolve;
    qrImg.src = qrPngUrl;
  });
  
  const qrPadding = qrBoxSize * 0.04;
  ctx.drawImage(
    qrImg, 
    qrBoxX + qrPadding, 
    qrBoxY + qrPadding, 
    qrBoxSize - (qrPadding * 2), 
    qrBoxSize - (qrPadding * 2)
  );

  // 6. Insignia central sobre el QR con escudo
  const centerSize = qrBoxSize * 0.22;
  const centerX = pxSize / 2;
  const centerY = qrBoxY + (qrBoxSize / 2);

  ctx.fillStyle = '#00A896';
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, pxSize * 0.008);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(centerSize * 0.45)}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('EV', centerX, centerY);
  ctx.textBaseline = 'alphabetic';

  // 7. Pie del Sticker: Código SKU y Texto de Emergencia
  const cleanSku = (sku || '').replace(/[#-]/g, '').toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(pxSize * 0.058)}px 'JetBrains Mono', monospace`;
  ctx.fillText(cleanSku, pxSize / 2, pxSize * 0.85);

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(pxSize * 0.03)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('ESCANEE EN CASO DE EMERGENCIA', pxSize / 2, pxSize * 0.91);

  ctx.restore();
  return canvas;
}

/**
 * Exporta un lote de stickers en archivo .ZIP
 */
export async function exportBatchToZip(qrs, sizeCm = 8, baseUrl = window.location.origin) {
  const zip = new JSZip();
  const folder = zip.folder(`Stickers_EscudoVial_${sizeCm}x${sizeCm}cm`);

  for (const qr of qrs) {
    const targetUrl = `${baseUrl}/v/${qr.sku}`;
    const canvas = await createStickerCanvas(qr.sku, targetUrl, sizeCm);
    
    // Obtener blob PNG
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`Sticker_${qr.sku}_${sizeCm}x${sizeCm}cm.png`, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(content);
  downloadLink.download = `Lote_Stickers_EscudoVial_${qrs.length}_unidades.zip`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Exporta un pliego PDF para imprenta en formato A4 con marcas de corte
 */
export async function exportBatchToPdf(qrs, sizeCm = 8, baseUrl = window.location.origin) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4' // 21.0 x 29.7 cm
  });

  const pageWidth = 21.0;
  const pageHeight = 29.7;
  const margin = 1.0;

  // Calcular columnas y filas según el tamaño seleccionado
  const stickerW = sizeCm;
  const stickerH = sizeCm;
  const gap = 0.8;

  const cols = Math.floor((pageWidth - (margin * 2) + gap) / (stickerW + gap));
  const rows = Math.floor((pageHeight - (margin * 2) - 1.5 + gap) / (stickerH + gap)); // 1.5cm para header
  const stickersPerPage = Math.max(1, cols * rows);

  let currentStickerIndex = 0;

  while (currentStickerIndex < qrs.length) {
    if (currentStickerIndex > 0) {
      doc.addPage();
    }

    // Header del pliego
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(83, 44, 140);
    doc.text('ESCUDO VIAL - PLIEGO OFICIAL DE IMPRESIÓN Y TROQUELADO', margin, margin);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tamaño Sticker: ${sizeCm}x${sizeCm} cm | Fecha: ${new Date().toLocaleDateString()}`, margin, margin + 0.4);

    let pageStickerCount = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentStickerIndex >= qrs.length) break;

        const qr = qrs[currentStickerIndex];
        const targetUrl = `${baseUrl}/v/${qr.sku}`;
        const canvas = await createStickerCanvas(qr.sku, targetUrl, sizeCm);
        const imgData = canvas.toDataURL('image/png');

        const x = margin + c * (stickerW + gap);
        const y = margin + 1.0 + r * (stickerH + gap);

        // Dibujar el sticker
        doc.addImage(imgData, 'PNG', x, y, stickerW, stickerH);

        // Dibujar líneas tenues de corte / troquel alrededor
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.02);
        doc.rect(x, y, stickerW, stickerH);

        currentStickerIndex++;
        pageStickerCount++;
      }
    }
  }

  doc.save(`Pliego_Impresion_EscudoVial_${qrs.length}_stickers.pdf`);
}

/**
 * Dibuja el Código QR puro con la insignia central "EV" en Canvas a resolución 300 DPI
 */
export async function createStandaloneQrCanvas(sku, targetUrl, sizeCm = 8, options = {}) {
  const {
    transparentBg = false,
    darkColor = '#231749',
    showSkuFooter = false
  } = options;

  // 300 DPI: 1 cm ≈ 118 px. Min 512px para alta definición
  const pxSize = Math.max(512, Math.round(sizeCm * 118));
  const canvas = document.createElement('canvas');
  canvas.width = pxSize;
  canvas.height = pxSize;
  const ctx = canvas.getContext('2d');

  const cornerRadius = pxSize * 0.12;

  // 1. Fondo de la tarjeta (blanco o transparente)
  if (!transparentBg) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, pxSize, pxSize, cornerRadius);
    ctx.fill();
  }

  // 2. Espacio interior para el código QR
  const margin = Math.round(pxSize * (showSkuFooter ? 0.08 : 0.09));
  const qrSize = pxSize - (margin * 2);

  // 3. Generar el código QR puro con nivel de corrección H
  const qrPngUrl = await QRCode.toDataURL(targetUrl, {
    width: qrSize,
    margin: 1,
    color: {
      dark: darkColor,
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });

  const qrImg = new Image();
  await new Promise((resolve) => {
    qrImg.onload = resolve;
    qrImg.src = qrPngUrl;
  });

  // Dibujar el código QR centrado
  const qrY = showSkuFooter ? margin * 0.7 : margin;
  ctx.drawImage(qrImg, margin, qrY, qrSize, qrSize);

  // 4. Insignia circular central "EV"
  const centerSize = qrSize * 0.22;
  const centerX = pxSize / 2;
  const centerY = qrY + (qrSize / 2);

  // Círculo verde azulado #00A896
  ctx.fillStyle = '#00A896';
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Borde blanco grueso
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, pxSize * 0.018);
  ctx.stroke();

  // Texto "EV" centrado en blanco
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(centerSize * 0.44)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EV', centerX, centerY);
  ctx.textBaseline = 'alphabetic';

  // 5. SKU opcional al pie
  if (showSkuFooter) {
    const cleanSku = (sku || '').replace(/[#-]/g, '').toUpperCase();
    ctx.fillStyle = darkColor;
    ctx.font = `bold ${Math.round(pxSize * 0.05)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(cleanSku, pxSize / 2, pxSize - (margin * 0.4));
  }

  return canvas;
}

/**
 * Descarga individual del código QR puro en PNG
 */
export async function exportStandaloneQrPng(sku, targetUrl, sizeCm = 8, options = {}) {
  const canvas = await createStandaloneQrCanvas(sku, targetUrl, sizeCm, options);
  const cleanSku = (sku || 'QR').replace(/[#-]/g, '').toUpperCase();
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `QR_${cleanSku}_${sizeCm}x${sizeCm}cm.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta lote de códigos QR puros en un archivo ZIP
 */
export async function exportBatchStandaloneQrZip(qrs, sizeCm = 8, baseUrl = window.location.origin, options = {}) {
  const zip = new JSZip();
  const folder = zip.folder(`QRs_EscudoVial_${sizeCm}x${sizeCm}cm`);

  for (const qr of qrs) {
    const cleanSku = (qr.sku || '').replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${baseUrl}/v/${cleanSku}`;
    const canvas = await createStandaloneQrCanvas(cleanSku, targetUrl, sizeCm, options);
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`QR_${cleanSku}_${sizeCm}x${sizeCm}cm.png`, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(content);
  downloadLink.download = `Lote_QRs_Puros_EscudoVial_${qrs.length}_unidades_${sizeCm}x${sizeCm}cm.zip`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Exporta pliego PDF con cuadrícula de códigos QR puros listos para troquel o corte
 */
export async function exportBatchStandaloneQrPdf(qrs, sizeCm = 8, baseUrl = window.location.origin, options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4' // 21.0 x 29.7 cm
  });

  const pageWidth = 21.0;
  const pageHeight = 29.7;
  const margin = 1.0;

  const qrW = sizeCm;
  const qrH = sizeCm;
  const gap = 0.6;

  const cols = Math.floor((pageWidth - (margin * 2) + gap) / (qrW + gap));
  const rows = Math.floor((pageHeight - (margin * 2) - 1.5 + gap) / (qrH + gap));

  let currentIndex = 0;

  while (currentIndex < qrs.length) {
    if (currentIndex > 0) {
      doc.addPage();
    }

    // Cabecera del pliego
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(83, 44, 140);
    doc.text('ESCUDO VIAL - PLIEGO DE CÓDIGOS QR PUROS', margin, margin);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Dimensión QR: ${sizeCm}x${sizeCm} cm | ${qrs.length} códigos en lote | Fecha: ${new Date().toLocaleDateString()}`, margin, margin + 0.4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentIndex >= qrs.length) break;

        const qr = qrs[currentIndex];
        const cleanSku = (qr.sku || '').replace(/[#-]/g, '').toUpperCase();
        const targetUrl = `${baseUrl}/v/${cleanSku}`;
        const canvas = await createStandaloneQrCanvas(cleanSku, targetUrl, sizeCm, options);
        const imgData = canvas.toDataURL('image/png');

        const x = margin + c * (qrW + gap);
        const y = margin + 1.0 + r * (qrH + gap);

        // Insertar imagen del QR puro
        doc.addImage(imgData, 'PNG', x, y, qrW, qrH);

        // Guía de corte / troquelado tenue
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.015);
        doc.rect(x, y, qrW, qrH);

        // Texto SKU pequeño debajo de la línea
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(cleanSku, x + (qrW / 2), y + qrH + 0.35, { align: 'center' });

        currentIndex++;
      }
    }
  }

  doc.save(`Pliego_QRs_Puros_EscudoVial_${qrs.length}_unidades_${sizeCm}x${sizeCm}cm.pdf`);
}


/**
 * Utilidades para captura y compresión de fotos y notas de voz ligeras
 * compatibles con navegadores móviles modernos y almacenamiento en Supabase.
 */

export async function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Archivo no válido como imagen'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a JPEG comprimido
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Grabar nota de voz usando MediaRecorder nativo del navegador
 */
export async function createVoiceRecorder() {
  if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new Error('Tu navegador no soporta grabación de notas de voz');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Seleccionar formato soportado
  let mimeType = 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    mimeType = 'audio/webm;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
    mimeType = 'audio/mp4';
  } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
    mimeType = 'audio/ogg';
  }

  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.start(200);

  return {
    stop: () => {
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          // Detener todas las pistas de audio para apagar el micrófono
          stream.getTracks().forEach(track => track.stop());

          const audioBlob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        };
        mediaRecorder.stop();
      });
    },
    cancel: () => {
      stream.getTracks().forEach(track => track.stop());
      try {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      } catch {}
    }
  };
}

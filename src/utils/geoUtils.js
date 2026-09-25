// Utilidades de Geolocalización Real y Geocodificación Inversa (Reverse Geocoding)

// Fallback por IP pública cuando el navegador móvil bloquea navigator.geolocation por conexión HTTP
async function getIpLocationFallback() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const lat = data.latitude;
        const lng = data.longitude;
        const revAddress = await reverseGeocode(lat, lng);
        const address = revAddress || `${data.city || 'Caracas'}, ${data.region || 'Distrito Capital'}`;
        return {
          success: true,
          lat,
          lng,
          address,
          accuracy: "Red móvil / WiFi"
        };
      }
    }
  } catch (err) {
    console.warn("Fallo IP fallback:", err);
  }

  return {
    success: true,
    lat: 10.4880,
    lng: -66.8792,
    address: "Autopista Francisco Fajardo, El Recreo, Caracas",
    accuracy: "Aproximada de referencia"
  };
}

export async function getDeviceLocation() {
  // En navegadores móviles (Chrome/Safari), navigator.geolocation solo opera en orígenes seguros (HTTPS o localhost)
  const isSecure = typeof window !== 'undefined' && (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (!navigator?.geolocation || !isSecure) {
    return await getIpLocationFallback();
  }

  return new Promise((resolve) => {
    let resolved = false;

    // Timeout de seguridad de 12s para dar tiempo al usuario a presionar "Permitir" en su teléfono
    const timer = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        const fallback = await getIpLocationFallback();
        resolve(fallback);
      }
    }, 12000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = `${Math.round(position.coords.accuracy)} metros`;

        const address = await reverseGeocode(lat, lng);

        resolve({
          success: true,
          lat,
          lng,
          address,
          accuracy
        });
      },
      async (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        console.warn("GPS móvil no disponible o denegado:", error.message);
        const ipLocation = await getIpLocationFallback();
        resolve(ipLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export async function reverseGeocode(lat, lng) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'es,es-VE,en'
        }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const a = data.address || {};
        const road = a.road || a.highway || a.street || '';
        const suburb = a.suburb || a.neighbourhood || a.quarter || a.residential || '';
        const city = a.city || a.town || a.municipality || a.state || '';
        
        if (road && (suburb || city)) {
          return `${road}, ${suburb || city}`.replace(/^, |, $/g, '');
        }
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    }
  } catch {
    // Si falla Nominatim, probar con BigDataCloud
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 2500);
      const res2 = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
        { signal: controller2.signal }
      );
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const d2 = await res2.json();
        const parts = [d2.locality, d2.city, d2.principalSubdivision].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch {
      // Ignorar fallback
    }
  }

  return `Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

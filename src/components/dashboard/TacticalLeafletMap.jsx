import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Layers, 
  Maximize2, 
  Truck,
  ShieldAlert,
  Car
} from 'lucide-react';

const TILE_LAYERS = {
  dark: {
    name: 'Táctico Oscuro',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors',
    className: 'tactical-dark-tiles',
    maxZoom: 19
  },
  streets: {
    name: 'Calles OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors',
    className: '',
    maxZoom: 19
  },
  satellite: {
    name: 'Satélite HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    attribution: '&copy; Esri World Imagery',
    className: '',
    maxZoom: 18
  }
};

export default function TacticalLeafletMap({
  emergencies = [],
  selectedEmergency = null,
  onSelectEmergency = () => {}
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeLayerKey, setActiveLayerKey] = useState('streets'); // Por defecto: Calles OSM
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Coordenadas nacionales de Venezuela (para cuando no hay alertas activas)
  const VENEZUELA_CENTER = [7.8, -65.8];
  const VENEZUELA_ZOOM = 6;
  const STREET_ZOOM = 17; // Zoom exacto de calle

  // 1. Inicializar el mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Ya inicializado

    const hasActiveEmergency = selectedEmergency?.location?.lat && emergencies.length > 0;
    const initialLat = hasActiveEmergency ? selectedEmergency.location.lat : VENEZUELA_CENTER[0];
    const initialLng = hasActiveEmergency ? selectedEmergency.location.lng : VENEZUELA_CENTER[1];
    const initialZoom = hasActiveEmergency ? STREET_ZOOM : VENEZUELA_ZOOM;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    const activeConfig = TILE_LAYERS[activeLayerKey];
    const tileLayer = L.tileLayer(activeConfig.url, {
      subdomains: activeConfig.subdomains,
      maxZoom: activeConfig.maxZoom,
      className: activeConfig.className || ''
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Forzar recalculo de dimensiones
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Cambio dinámico de capa de mapa (Calles OSM, Táctico, Satélite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newConfig = TILE_LAYERS[activeLayerKey];
    const newTile = L.tileLayer(newConfig.url, {
      subdomains: newConfig.subdomains,
      maxZoom: newConfig.maxZoom,
      className: newConfig.className || ''
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [activeLayerKey]);

  // 3. Renderizado de pines y alertas tácticas en el mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    emergencies.forEach((emg) => {
      const lat = emg.location?.lat || defaultCenter[0];
      const lng = emg.location?.lng || defaultCenter[1];
      const isSelected = selectedEmergency?.id === emg.id;
      const isResolved = emg.status === 'resuelto';

      // HTML interactivo para el Pin
      const pinColor = isResolved 
        ? 'bg-slate-800 border-slate-600 text-slate-300' 
        : emg.status === 'critico'
          ? 'bg-rose-600 border-white text-white shadow-rose-600/60'
          : 'bg-teal-600 border-white text-white shadow-teal-600/60';

      const pulseHtml = !isResolved 
        ? `<div class="absolute -inset-3.5 rounded-full animate-ping opacity-75 ${emg.status === 'critico' ? 'bg-rose-500' : 'bg-teal-500'}"></div>` 
        : '';

      const iconHtml = `
        <div class="relative cursor-pointer transition-transform transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'}">
          ${pulseHtml}
          <div class="relative px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xl border-2 font-sans ${pinColor}">
            <span class="material-symbols-outlined text-[15px] font-bold">
              ${isResolved ? 'check_circle' : 'e911_emergency'}
            </span>
            <span class="font-mono text-[11px] font-black tracking-tight">
              ${emg.sku}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-radar-marker',
        iconSize: [80, 36],
        iconAnchor: [40, 18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Popup informativo enriquecido con calles reales
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 190px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #532C8C; font-size: 13px;">${emg.folio}</strong>
            <span style="font-size: 9px; font-weight: 800; background: ${emg.status === 'critico' ? '#ffe4e6' : '#ccfbf1'}; color: ${emg.status === 'critico' ? '#be123c' : '#0f766e'}; padding: 1px 6px; border-radius: 4px; text-transform: uppercase;">
              ${emg.status}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #1e293b;">${emg.holderName}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${emg.vehicle || 'Vehículo en vía'}</div>
          <div style="font-size: 10px; color: #0284c7; margin-top: 4px; font-weight: 600;">
            📍 ${emg.location?.address || 'Ubicación GPS'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10]
      });

      marker.on('click', () => {
        onSelectEmergency(emg.id);
      });

      markersLayerRef.current.addLayer(marker);

      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }

      // Si tiene unidad despachada en ruta, agregar pin de la unidad
      if (emg.dispatchedUnit && emg.status !== 'resuelto') {
        const unitLat = lat - 0.003;
        const unitLng = lng - 0.003;

        const unitHtml = `
          <div class="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold shadow-lg flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>${emg.dispatchedUnit}</span>
          </div>
        `;

        const unitIcon = L.divIcon({
          html: unitHtml,
          className: 'custom-unit-marker',
          iconSize: [110, 24],
          iconAnchor: [55, 12]
        });

        const unitMarker = L.marker([unitLat, unitLng], { icon: unitIcon });
        markersLayerRef.current.addLayer(unitMarker);
      }
    });
  }, [emergencies, selectedEmergency]);

  // 4. Volar a la dirección exacta cuando hay una alerta o recentrar en Venezuela si no hay casos
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedEmergency && selectedEmergency.location?.lat && selectedEmergency.location?.lng) {
      // Ir a la dirección exacta traída del escaneo a nivel de calle (Zoom 17)
      mapInstanceRef.current.flyTo(
        [selectedEmergency.location.lat, selectedEmergency.location.lng],
        STREET_ZOOM,
        { duration: 1.4 }
      );
    } else if (emergencies.length === 0) {
      // Si no hay rastreos/alertas, mostrar únicamente el mapa general de Venezuela
      mapInstanceRef.current.flyTo(VENEZUELA_CENTER, VENEZUELA_ZOOM, {
        duration: 1.2
      });
    }
  }, [selectedEmergency?.id, selectedEmergency?.location?.lat, selectedEmergency?.location?.lng, emergencies.length]);

  // Acciones de control del mapa
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterSelected = () => {
    if (!mapInstanceRef.current) return;
    if (selectedEmergency?.location?.lat && selectedEmergency?.location?.lng) {
      mapInstanceRef.current.flyTo(
        [selectedEmergency.location.lat, selectedEmergency.location.lng],
        STREET_ZOOM,
        { duration: 1 }
      );
    } else {
      mapInstanceRef.current.flyTo(VENEZUELA_CENTER, VENEZUELA_ZOOM, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-[430px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Controles Flotantes Superiores: Selector de Capas */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Cambiar tipo de mapa"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">{TILE_LAYERS[activeLayerKey].name}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-full right-0 mt-1.5 bg-slate-950/95 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md min-w-[150px] flex flex-col gap-1 z-40">
              {Object.entries(TILE_LAYERS).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveLayerKey(key);
                    setShowLayerMenu(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    activeLayerKey === key
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón Recentrar en la Alerta */}
        <button
          type="button"
          onClick={handleCenterSelected}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md shadow-lg transition-all cursor-pointer"
          title="Centrar en alerta activa"
        >
          <Crosshair className="w-4 h-4 text-rose-400" />
        </button>

        {/* Botones de Zoom */}
        <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-700 backdrop-blur-md shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer border-b border-slate-800"
            title="Acercar mapa"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Alejar mapa"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leyenda Táctica Flotante Inferior Izquierda */}
      <div className="absolute bottom-3 left-3 z-30 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-1.5 flex items-center gap-3 text-[10px] text-slate-200 shadow-xl pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="font-bold">S.O.S Crítico</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>En Camino</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Resuelto</span>
        </span>
      </div>

      {/* Si no hay alertas activas, overlay sutil */}
      {emergencies.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center pointer-events-none bg-slate-950/40 backdrop-blur-[2px]">
          <div className="p-4 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-700/80 max-w-xs shadow-2xl">
            <span className="text-teal-400 font-extrabold text-xs block mb-1 tracking-wider uppercase">
              Cartografía Vial en Vivo
            </span>
            <span className="text-slate-300 text-[11px] leading-relaxed block">
              Sin incidentes reportados en este momento. Las transmisiones S.O.S se ubicarán en tiempo real sobre las calles exactas.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

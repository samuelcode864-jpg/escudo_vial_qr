import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_QRS, INITIAL_EMERGENCIES, INITIAL_REPORTS } from '../data/mockData';
import { getDeviceLocation } from '../utils/geoUtils';
import {
  supabase,
  isSupabaseConfigured,
  mapQrFromDb,
  mapQrToDb,
  mapEmergencyFromDb,
  mapEmergencyToDb,
  mapReportFromDb,
  mapReportToDb
} from '../utils/supabaseClient';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [qrList, setQrList] = useState(() => {
    const saved = localStorage.getItem('ev_qr_list');
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch {
        list = [];
      }
    }

    if (!list || list.length === 0) {
      list = INITIAL_QRS || [];
    }

    // Normalizar SKUs y deduplicar para evitar duplicados en pantalla
    const seen = new Set();
    const deduped = [];
    for (const q of list) {
      const clean = (q.sku || '').replace(/[#-]/g, '').toUpperCase();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        deduped.push({ ...q, sku: clean });
      }
    }
    list = deduped;

    // Reconciliación: Si existen emergencias registradas en localStorage con datos de titular y vehículo,
    // garantizar que ese sticker aparezca en qrList como 'active' (Lleno / Entregado)
    try {
      const savedEmgs = localStorage.getItem('ev_emergencies');
      if (savedEmgs) {
        const emgs = JSON.parse(savedEmgs);
        emgs.forEach(emg => {
          if (emg.sku && emg.holderName && emg.holderName !== 'Usuario Escudo Vial') {
            const cleanSku = emg.sku.replace(/[#-]/g, '').toUpperCase();
            const existingIndex = list.findIndex(q => q.sku === cleanSku);
            const qrObj = {
              sku: cleanSku,
              status: 'active',
              category: 'Auto',
              scansCount: 1,
              activatedAt: emg.createdAt || new Date().toISOString(),
              holder: {
                name: emg.holderName,
                cedula: emg.cedula || 'V-00.000.000',
                phone: emg.phone || '0414-0000000',
                vehicle: emg.vehicle || 'Vehículo Particular',
                plate: emg.vehicle?.match(/\((.*?)\)/)?.[1] || 'S/P',
                bloodType: 'O+',
                emergencyContactName: 'Familiar de Contacto',
                emergencyContactPhone: emg.phone || '0414-0000000',
                insurancePolicy: `Póliza Escudo Vial 24/7 #${cleanSku}`
              }
            };
            if (existingIndex >= 0) {
              list[existingIndex] = { ...list[existingIndex], ...qrObj };
            } else {
              list.push(qrObj);
            }
          }
        });
      }
    } catch (e) {
      console.warn("Reconciliación de emergencias:", e);
    }

    return list;
  });

  const [emergencies, setEmergencies] = useState(() => {
    const saved = localStorage.getItem('ev_emergencies');
    if (!saved) return INITIAL_EMERGENCIES || [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(e => ({
        ...e,
        sku: e.sku ? e.sku.replace(/[#-]/g, '').toUpperCase() : 'EV8842VE'
      }));
    } catch {
      return INITIAL_EMERGENCIES || [];
    }
  });

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('ev_reports');
    if (!saved) return INITIAL_REPORTS || [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter(r => r.id !== 'rep-201' && r.id !== 'rep-202');
    } catch {
      return INITIAL_REPORTS || [];
    }
  });

  const [activeSku, setActiveSku] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const skuParam = params.get('sku');
    const pathMatch = window.location.pathname.match(/\/v\/([A-Za-z0-9_-]+)/);
    const pathSku = pathMatch ? pathMatch[1] : null;
    const finalSku = pathSku || skuParam || 'EV8842VE';
    return finalSku.replace(/[#-]/g, '').toUpperCase();
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadAlert, setUnreadAlert] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('ev_admin_auth') === 'true';
  });

  // Pedir permiso de ubicación GPS automáticamente al abrir la app (Estilo Google)
  useEffect(() => {
    getDeviceLocation().then(loc => {
      if (loc) {
        setCurrentLocation(loc);
      }
    });
  }, []);

  // Sincronización con Supabase (Nube en Tiempo Real) o Servidor Central Local (/api/database)
  useEffect(() => {
    let isMounted = true;
    let evtSource = null;
    let channel = null;
    let sbChannel = null;

    if (isSupabaseConfigured && supabase) {
      // MODO NUBE: Supabase PostgreSQL + Realtime WebSockets
      Promise.all([
        supabase.from('qrs').select('*').order('created_at', { ascending: false }),
        supabase.from('emergencies').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*').order('created_at', { ascending: false })
      ]).then(([qrsRes, emgRes, repRes]) => {
        if (!isMounted) return;
        if (qrsRes.data && qrsRes.data.length > 0) {
          const mappedQrs = qrsRes.data.map(mapQrFromDb);
          const seen = new Set();
          const deduped = [];
          for (const q of mappedQrs) {
            const clean = (q.sku || '').toUpperCase();
            if (clean && !seen.has(clean)) {
              seen.add(clean);
              deduped.push(q);
            }
          }
          setQrList(deduped);
          localStorage.setItem('ev_qr_list', JSON.stringify(deduped));
        }
        if (emgRes.data) {
          const mappedEmgs = emgRes.data.map(mapEmergencyFromDb);
          setEmergencies(mappedEmgs);
          localStorage.setItem('ev_emergencies', JSON.stringify(mappedEmgs));
        }
        if (repRes.data) {
          const mappedReps = repRes.data.map(mapReportFromDb);
          setReports(mappedReps);
          localStorage.setItem('ev_reports', JSON.stringify(mappedReps));
        }
      }).catch(err => {
        console.warn("Error cargando datos de Supabase:", err);
      });

      // Suscripción a eventos Realtime de Supabase
      sbChannel = supabase.channel('escudo_vial_cloud_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newEmg = mapEmergencyFromDb(payload.new);
            setEmergencies(prev => [newEmg, ...prev.filter(e => e.id !== newEmg.id)]);
            setUnreadAlert(newEmg);
            playEmergencyAudio();
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapEmergencyFromDb(payload.new);
            setEmergencies(prev => prev.map(e => e.id === updated.id ? updated : e));
            if (updated.status === 'critico') {
              setUnreadAlert(updated);
              playEmergencyAudio();
            }
          } else if (payload.eventType === 'DELETE') {
            setEmergencies(prev => prev.filter(e => e.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'qrs' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedQr = mapQrFromDb(payload.new);
            setQrList(prev => {
              const idx = prev.findIndex(q => q.sku.toUpperCase() === updatedQr.sku.toUpperCase());
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = updatedQr;
                return copy;
              }
              return [updatedQr, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedSku = payload.old?.sku ? payload.old.sku.toUpperCase() : '';
            if (deletedSku) {
              setQrList(prev => prev.filter(q => q.sku.toUpperCase() !== deletedSku));
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const rep = mapReportFromDb(payload.new);
            setReports(prev => [rep, ...prev.filter(r => r.id !== rep.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const rep = mapReportFromDb(payload.new);
            setReports(prev => prev.map(r => r.id === rep.id ? rep : r));
          }
        })
        .subscribe();
    } else {
      // MODO LOCAL / DESARROLLO: Cargar estado del servidor Vite Express mock
      fetch('/api/database')
        .then(res => res.json())
        .then(db => {
          if (!isMounted || !db) return;
          if (Array.isArray(db.qrList) && db.qrList.length > 0) {
            setQrList(db.qrList);
            localStorage.setItem('ev_qr_list', JSON.stringify(db.qrList));
          }
          if (Array.isArray(db.emergencies)) {
            setEmergencies(db.emergencies);
            localStorage.setItem('ev_emergencies', JSON.stringify(db.emergencies));
          }
          if (Array.isArray(db.reports)) {
            setReports(db.reports);
            localStorage.setItem('ev_reports', JSON.stringify(db.reports));
          }
        })
        .catch(() => {});

      // Conectar a Stream SSE local
      try {
        evtSource = new EventSource('/api/database/stream');
        evtSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload?.data) {
              const { qrList: incomingQrs, emergencies: incomingEmgs, reports: incomingReps } = payload.data;
              if (Array.isArray(incomingQrs)) setQrList(incomingQrs);
              if (Array.isArray(incomingEmgs)) setEmergencies(incomingEmgs);
              if (Array.isArray(incomingReps)) setReports(incomingReps);
              if (payload.type === 'NEW_EMERGENCY') {
                playEmergencyAudio();
              }
            }
          } catch {
            // Ignorar parse error
          }
        };
      } catch {
        // Ignorar fallback
      }
    }

    // Sincronización entre pestañas en el mismo navegador (BroadcastChannel)
    try {
      channel = new BroadcastChannel('escudo_vial_sync');
      channel.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'NEW_EMERGENCY') {
          setEmergencies(prev => [data, ...prev.filter(e => e.id !== data.id)]);
          setUnreadAlert(data);
          playEmergencyAudio();
        } else if (type === 'UPDATE_EMERGENCY') {
          setEmergencies(prev => prev.map(e => e.id === data.id ? data : e));
        } else if (type === 'NEW_REPORT') {
          setReports(prev => [data, ...prev.filter(r => r.id !== data.id)]);
        } else if (type === 'UPDATE_QR') {
          setQrList(prev => prev.map(q => q.sku.toUpperCase() === data.sku.toUpperCase() ? data : q));
        } else if (type === 'BATCH_QRS') {
          setQrList(prev => {
            const existingSkus = new Set(prev.map(q => q?.sku ? q.sku.toUpperCase() : ''));
            const toAdd = data.filter(d => !existingSkus.has(d?.sku ? d.sku.toUpperCase() : ''));
            return [...toAdd, ...prev];
          });
        } else if (type === 'DELETE_QR') {
          setQrList(prev => prev.filter(q => q.sku.toUpperCase() !== data.sku.toUpperCase()));
        } else if (type === 'DELETE_EMERGENCY') {
          setEmergencies(prev => prev.filter(e => e.id !== data.id));
        } else if (type === 'CLEAR_RESOLVED') {
          setEmergencies(prev => prev.filter(e => e.status !== 'resuelto'));
        }
      };
    } catch {
      // Ignorar fallback
    }

    return () => {
      isMounted = false;
      if (sbChannel) supabase.removeChannel(sbChannel);
      if (evtSource) evtSource.close();
      if (channel) channel.close();
    };
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('ev_qr_list', JSON.stringify(qrList));
  }, [qrList]);

  useEffect(() => {
    localStorage.setItem('ev_emergencies', JSON.stringify(emergencies));
  }, [emergencies]);

  useEffect(() => {
    localStorage.setItem('ev_reports', JSON.stringify(reports));
  }, [reports]);

  const playEmergencyAudio = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext bloqueado
    }
  };

  const broadcastMessage = (type, data) => {
    try {
      const channel = new BroadcastChannel('escudo_vial_sync');
      channel.postMessage({ type, data });
      channel.close();
    } catch {
      // Ignorar
    }
  };

  const syncServer = (type, payload) => {
    broadcastMessage(type, payload);
    fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    }).catch(() => {});

    // Sincronización transparente con Supabase en la Nube
    if (isSupabaseConfigured && supabase) {
      if (type === 'NEW_EMERGENCY' || type === 'UPDATE_EMERGENCY') {
        const dbEmg = mapEmergencyToDb(payload);
        if (dbEmg) supabase.from('emergencies').upsert(dbEmg).catch(e => console.warn('Supabase emg error:', e));
      } else if (type === 'DELETE_EMERGENCY') {
        supabase.from('emergencies').delete().eq('id', payload.id).catch(e => console.warn('Supabase del emg error:', e));
      } else if (type === 'CLEAR_RESOLVED') {
        supabase.from('emergencies').delete().eq('status', 'resuelto').catch(e => console.warn('Supabase clear error:', e));
      } else if (type === 'UPDATE_QR') {
        const dbQr = mapQrToDb(payload);
        if (dbQr) supabase.from('qrs').upsert(dbQr).catch(e => console.warn('Supabase qr error:', e));
      } else if (type === 'BATCH_QRS') {
        if (Array.isArray(payload) && payload.length > 0) {
          const dbQrs = payload.map(mapQrToDb);
          supabase.from('qrs').upsert(dbQrs).catch(e => console.warn('Supabase batch qr error:', e));
        }
      } else if (type === 'DELETE_QR') {
        supabase.from('qrs').delete().eq('sku', payload.sku).catch(e => console.warn('Supabase del qr error:', e));
      } else if (type === 'NEW_REPORT') {
        const dbRep = mapReportToDb(payload);
        if (dbRep) supabase.from('reports').upsert(dbRep).catch(e => console.warn('Supabase rep error:', e));
      }
    }
  };

  const currentQr = qrList.find(q => q.sku.toUpperCase() === activeSku.toUpperCase()) || {
    sku: activeSku,
    status: 'inactive',
    holder: null,
    scansCount: 0
  };

  // 1. DISPARAR EMERGENCIA CON DESPACHO INMEDIATO A SUPABASE (0ms de retraso)
  const triggerSos = async ({ sku, cedula, phone, reporterType, customAddress = null, detectedCoords = null }) => {
    const targetSku = (sku || activeSku || 'EV8842VE').replace(/[#-]/g, '').toUpperCase();
    const qrRecord = qrList.find(q => q.sku.toUpperCase() === targetSku);
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const locationData = {
      lat: detectedCoords?.lat || 10.4880,
      lng: detectedCoords?.lng || -66.8792,
      address: customAddress && customAddress.trim() 
        ? customAddress.trim() 
        : (detectedCoords?.address || "Autopista Francisco Fajardo, El Recreo, Caracas"),
      gpsAccuracy: detectedCoords?.accuracy || "Aproximada en vivo"
    };

    const newEmergency = {
      id: `emg-${Date.now()}`,
      folio: `#SOS-${randomNum}-CRT`,
      sku: targetSku,
      holderName: qrRecord?.holder?.name || 'Usuario Escudo Vial',
      cedula: cedula || qrRecord?.holder?.cedula || 'V-00.000.000',
      phone: phone || qrRecord?.holder?.phone || 'Sin número',
      reporterType: reporterType || 'titular',
      status: 'critico',
      createdAt: new Date().toISOString(),
      location: locationData,
      vehicle: qrRecord?.holder?.vehicle 
        ? `${qrRecord.holder.vehicle} (${qrRecord.holder.plate || ''})` 
        : "Vehículo en vía",
      dispatchedUnit: null,
      notes: [
        { 
          time: "Justo ahora", 
          text: `Alerta S.O.S despachada por ${reporterType === 'titular' ? 'el conductor titular' : 'un testigo en vía'} en ${locationData.address}` 
        }
      ]
    };

    // Actualizar estado local inmediatamente
    setEmergencies(prev => [newEmergency, ...prev]);
    setUnreadAlert(newEmergency);
    playEmergencyAudio();

    // Guardar DIRECTAMENTE en Supabase Cloud con inserción inmediata
    if (isSupabaseConfigured && supabase) {
      try {
        const dbEmg = mapEmergencyToDb(newEmergency);
        await supabase.from('emergencies').insert(dbEmg);
      } catch (err) {
        console.error("Error enviando emergencia a Supabase:", err);
      }
    }

    syncServer('NEW_EMERGENCY', newEmergency);

    setQrList(prev => prev.map(q => {
      if (q?.sku && q.sku.toUpperCase() === targetSku) {
        return { 
          ...q, 
          scansCount: (q.scansCount || 0) + 1,
          lastLocation: locationData
        };
      }
      return q;
    }));

    // Búsqueda en segundo plano de GPS de mayor precisión sin demorar el despacho
    if (!detectedCoords) {
      getDeviceLocation().then(geo => {
        if (geo && (geo.lat !== locationData.lat || geo.lng !== locationData.lng)) {
          const refinedLocation = {
            lat: geo.lat,
            lng: geo.lng,
            address: geo.address || locationData.address,
            gpsAccuracy: geo.accuracy || "GPS Alta Precisión"
          };
          setEmergencies(prev => prev.map(e => e.id === newEmergency.id ? { ...e, location: refinedLocation } : e));
          if (isSupabaseConfigured && supabase) {
            supabase.from('emergencies').update({ location: refinedLocation }).eq('id', newEmergency.id).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    return newEmergency;
  };

  // 2. ACTIVAR QR
  const activateQr = async ({ sku, cedula, phone, name = "Usuario Escudo Vial", vehicle = "Vehículo Particular", plate = "AA111XX", bloodType = "O+", emergencyContact = "" }) => {
    const targetSku = (sku || activeSku).replace(/[#-]/g, '').toUpperCase();
    let locationData = null;
    try {
      const geo = await getDeviceLocation();
      locationData = { lat: geo.lat, lng: geo.lng, address: geo.address };
    } catch {
      // Ignorar
    }

    let updatedObj = null;

    setQrList(prev => {
      const exists = prev.some(q => q.sku.replace(/[#-]/g, '').toUpperCase() === targetSku);
      if (exists) {
        return prev.map(q => {
          if (q.sku.replace(/[#-]/g, '').toUpperCase() === targetSku) {
            updatedObj = {
              ...q,
              sku: targetSku,
              status: 'active',
              activatedAt: new Date().toISOString(),
              scansCount: (q.scansCount || 0) + 1,
              lastLocation: locationData || q.lastLocation,
              holder: {
                name: name || q.holder?.name,
                cedula: cedula || q.holder?.cedula,
                phone: phone || q.holder?.phone,
                vehicle: vehicle || q.holder?.vehicle,
                plate: plate || q.holder?.plate,
                color: q.holder?.color || "No especificado",
                bloodType: bloodType || q.holder?.bloodType || "O+",
                emergencyContactName: emergencyContact || q.holder?.emergencyContactName || "Contacto Familiar",
                emergencyContactPhone: phone,
                insurancePolicy: `Póliza Escudo Vial 24/7 #${targetSku}`
              }
            };
            return updatedObj;
          }
          return q;
        });
      } else {
        updatedObj = {
          sku: targetSku,
          status: 'active',
          category: 'Auto',
          activatedAt: new Date().toISOString(),
          scansCount: 1,
          lastLocation: locationData,
          holder: {
            name,
            cedula,
            phone,
            vehicle,
            plate,
            color: "Gris",
            bloodType,
            emergencyContactName: emergencyContact || "Contacto Familiar",
            emergencyContactPhone: phone,
            insurancePolicy: `Póliza Escudo Vial 24/7 #${targetSku}`
          }
        };
        return [updatedObj, ...prev];
      }
    });

    if (updatedObj) {
      if (isSupabaseConfigured && supabase) {
        try {
          const dbQr = mapQrToDb(updatedObj);
          await supabase.from('qrs').upsert(dbQr, { onConflict: 'sku' });
        } catch (e) {
          console.warn('Supabase qr error:', e);
        }
      }
      syncServer('UPDATE_QR', updatedObj);
    }

    return updatedObj;
  };

  // 3. ENVIAR REPORTE
  const submitReport = async ({ reason, details, sku }) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const targetSku = sku || activeSku;

    let locationData = {
      lat: 10.4850,
      lng: -66.8900,
      address: "Coordenadas vía reporte ciudadano"
    };

    try {
      const geo = await getDeviceLocation();
      locationData = { lat: geo.lat, lng: geo.lng, address: geo.address };
    } catch {
      // Ignorar
    }

    const newReport = {
      id: `rep-${Date.now()}`,
      folio: `#REP-${randomNum}-SEG`,
      sku: targetSku,
      reason: reason || "Incidente en vía reportado",
      details: details || "Sin observaciones adicionales proporcionadas.",
      status: "nuevo",
      createdAt: new Date().toISOString(),
      location: locationData
    };

    setReports(prev => [newReport, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        const dbRep = mapReportToDb(newReport);
        await supabase.from('reports').upsert(dbRep);
      } catch (err) {
        console.error("Error enviando reporte a Supabase:", err);
      }
    }

    syncServer('NEW_REPORT', newReport);
    return newReport;
  };

  // 4. GENERACIÓN DE QRS POR LOTE (BATCH GENERATOR)
  const createBatchQrs = async (count = 10, prefix = 'EV2026', vehicleCategory = 'Auto') => {
    const newItems = [];
    const existingSkus = new Set(qrList.map(q => q.sku.toUpperCase()));
    const defaultPrefix = vehicleCategory?.toUpperCase().includes('MOTO') ? 'EVMOTO' : 'EVAUTO';
    const cleanPrefix = (prefix && prefix !== 'EV2026' ? prefix : defaultPrefix).replace(/[#-]/g, '').toUpperCase();

    let counter = 1;
    for (let i = 1; i <= count; i++) {
      let candidateSku = `${cleanPrefix}${String(counter).padStart(4, '0')}`;
      while (existingSkus.has(candidateSku.toUpperCase())) {
        counter++;
        candidateSku = `${cleanPrefix}${String(counter).padStart(4, '0')}`;
      }
      existingSkus.add(candidateSku.toUpperCase());
      counter++;

      newItems.push({
        sku: candidateSku,
        status: 'inactive',
        category: vehicleCategory,
        holder: null,
        activatedAt: null,
        scansCount: 0,
        lastLocation: null
      });
    }

    setQrList(prev => [...newItems, ...prev]);

    if (isSupabaseConfigured && supabase && newItems.length > 0) {
      try {
        const dbQrs = newItems.map(mapQrToDb);
        await supabase.from('qrs').upsert(dbQrs, { onConflict: 'sku' });
      } catch (err) {
        console.error("Error guardando lote en Supabase:", err);
      }
    }

    syncServer('BATCH_QRS', newItems);
    return newItems;
  };

  const updateEmergencyStatus = (id, newStatus, unit = null) => {
    setEmergencies(prev => prev.map(emg => {
      if (emg.id === id) {
        const updatedNotes = [...emg.notes];
        if (newStatus === 'en_camino' && unit) {
          updatedNotes.unshift({ time: "Justo ahora", text: `Unidad despachada: ${unit}` });
        } else if (newStatus === 'resuelto') {
          updatedNotes.unshift({ time: "Justo ahora", text: `Emergencia finalizada con éxito y marcada como resuelta.` });
        }
        const updated = {
          ...emg,
          status: newStatus,
          dispatchedUnit: unit || emg.dispatchedUnit,
          notes: updatedNotes
        };
        syncServer('UPDATE_EMERGENCY', updated);
        return updated;
      }
      return emg;
    }));
  };

  const addEmergencyNote = (id, text) => {
    setEmergencies(prev => prev.map(emg => {
      if (emg.id === id) {
        const updated = {
          ...emg,
          notes: [{ time: "Justo ahora", text }, ...emg.notes]
        };
        syncServer('UPDATE_EMERGENCY', updated);
        return updated;
      }
      return emg;
    }));
  };

  const deleteEmergency = (id) => {
    setEmergencies(prev => prev.filter(emg => emg.id !== id));
    syncServer('DELETE_EMERGENCY', { id });
  };

  const clearResolvedEmergencies = () => {
    setEmergencies(prev => prev.filter(emg => emg.status !== 'resuelto'));
    syncServer('CLEAR_RESOLVED', {});
  };

  const updateReportStatus = (id, newStatus) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === id) {
        return { ...rep, status: newStatus };
      }
      return rep;
    }));
  };

  const generateNewQr = async (customSku = null, category = 'Auto') => {
    let sku = '';
    const existingSkus = new Set(qrList.map(q => q.sku.toUpperCase()));

    if (customSku && customSku.trim()) {
      sku = customSku.replace(/[#-]/g, '').trim().toUpperCase();
      if (existingSkus.has(sku)) {
        return null;
      }
    } else {
      // Secuencial correlativo según categoría: EVAUTO0001, EVMOTO0001, etc.
      const prefix = category?.toUpperCase().includes('MOTO') ? 'EVMOTO' : 'EVAUTO';
      let counter = 1;
      let candidate = `${prefix}${String(counter).padStart(4, '0')}`;
      while (existingSkus.has(candidate)) {
        counter++;
        candidate = `${prefix}${String(counter).padStart(4, '0')}`;
      }
      sku = candidate;
    }

    const newQr = {
      sku,
      status: 'inactive',
      category: category || 'Auto',
      holder: null,
      activatedAt: null,
      scansCount: 0,
      lastLocation: null
    };

    setQrList(prev => {
      if (prev.some(q => q.sku.toUpperCase() === newQr.sku.toUpperCase())) {
        return prev;
      }
      return [newQr, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const dbQr = mapQrToDb(newQr);
        await supabase.from('qrs').upsert(dbQr, { onConflict: 'sku' });
      } catch (err) {
        console.error("Error guardando QR en Supabase:", err);
      }
    }

    syncServer('UPDATE_QR', newQr);
    return newQr;
  };

  // Limpiar / Desvincular QR para devolverlo a estado "En Stock (Sin Llenar)"
  const resetQr = async (sku) => {
    const cleanSku = (sku || '').replace(/[#-]/g, '').toUpperCase();
    let updated = null;
    setQrList(prev => prev.map(q => {
      if (q.sku.toUpperCase() === cleanSku) {
        updated = {
          ...q,
          status: 'inactive',
          holder: null,
          activatedAt: null,
          scansCount: 0,
          lastLocation: null
        };
        return updated;
      }
      return q;
    }));

    if (updated) {
      if (isSupabaseConfigured && supabase) {
        try {
          const dbQr = mapQrToDb(updated);
          await supabase.from('qrs').upsert(dbQr, { onConflict: 'sku' });
        } catch (err) {
          console.error("Error reseteando QR en Supabase:", err);
        }
      }
      syncServer('UPDATE_QR', updated);
    }
    return updated;
  };

  // Eliminar QR permanentemente del sistema y de la base de datos
  const deleteQr = async (sku) => {
    const cleanSku = (sku || '').replace(/[#-]/g, '').toUpperCase();
    setQrList(prev => prev.filter(q => q.sku.toUpperCase() !== cleanSku));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('qrs').delete().eq('sku', cleanSku);
      } catch (err) {
        console.error("Error eliminando QR en Supabase:", err);
      }
    }
    syncServer('DELETE_QR', { sku: cleanSku });
  };

  const loginAdmin = (password) => {
    if (password === '12345') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('ev_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('ev_admin_auth');
  };

  const clearAllData = () => {
    localStorage.removeItem('ev_emergencies');
    localStorage.removeItem('ev_reports');
    localStorage.removeItem('ev_qr_list');
    setEmergencies([]);
    setReports([]);
    setQrList([]);
    setUnreadAlert(null);
  };

  return (
    <AppContext.Provider
      value={{
        qrList,
        emergencies,
        reports,
        activeSku,
        setActiveSku,
        currentQr,
        soundEnabled,
        setSoundEnabled,
        unreadAlert,
        setUnreadAlert,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        triggerSos,
        activateQr,
        submitReport,
        createBatchQrs,
        updateEmergencyStatus,
        addEmergencyNote,
        updateReportStatus,
        generateNewQr,
        clearAllData,
        deleteEmergency,
        clearResolvedEmergencies,
        isSupabaseConfigured,
        resetQr,
        deleteQr
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

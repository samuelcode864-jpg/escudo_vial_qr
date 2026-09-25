import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// ==========================================
// DB MAPPERS (CamelCase <-> Snake_Case)
// ==========================================

export function mapQrFromDb(row) {
  if (!row) return null;
  return {
    sku: row.sku,
    category: row.category || 'Auto',
    status: row.status || 'inactive',
    scansCount: row.scans_count || 0,
    activatedAt: row.activated_at || null,
    holder: row.holder || null,
    lastLocation: row.last_location || null
  };
}

export function mapQrToDb(qr) {
  if (!qr) return null;
  return {
    sku: qr.sku,
    category: qr.category || 'Auto',
    status: qr.status || 'inactive',
    scans_count: qr.scansCount || 0,
    activated_at: qr.activatedAt || null,
    holder: qr.holder || null,
    last_location: qr.lastLocation || null
  };
}

export function mapEmergencyFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    folio: row.folio,
    sku: row.sku,
    holderName: row.holder_name,
    cedula: row.cedula,
    phone: row.phone,
    reporterType: row.reporter_type,
    status: row.status,
    location: row.location,
    vehicle: row.vehicle,
    dispatchedUnit: row.dispatched_unit,
    notes: Array.isArray(row.notes) ? row.notes : [],
    createdAt: row.created_at
  };
}

export function mapEmergencyToDb(emg) {
  if (!emg) return null;
  return {
    id: emg.id,
    folio: emg.folio,
    sku: emg.sku,
    holder_name: emg.holderName,
    cedula: emg.cedula,
    phone: emg.phone,
    reporter_type: emg.reporterType || 'titular',
    status: emg.status || 'critico',
    location: emg.location,
    vehicle: emg.vehicle,
    dispatched_unit: emg.dispatchedUnit,
    notes: emg.notes,
    created_at: emg.createdAt
  };
}

export function mapReportFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    folio: row.folio,
    reason: row.type || row.reason,
    details: row.description || row.details,
    sku: row.sku || '',
    reporterPhone: row.reporter_phone,
    status: row.status,
    location: row.location,
    createdAt: row.created_at
  };
}

export function mapReportToDb(rep) {
  if (!rep) return null;
  return {
    id: rep.id,
    folio: rep.folio,
    type: rep.reason || rep.type,
    description: rep.details || rep.description,
    location: rep.location,
    reporter_phone: rep.reporterPhone || '',
    status: rep.status || 'nuevo',
    created_at: rep.createdAt
  };
}

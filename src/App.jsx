import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DriverPage from './pages/DriverPage';
import AdminPage from './pages/AdminPage';
import DemoSplitPage from './pages/DemoSplitPage';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
        {/* Ruta Pública del Conductor / Usuario al escanear el QR */}
        <Route path="/" element={<DriverPage />} />
        <Route path="/v/:sku" element={<DriverPage />} />
        <Route path="/sos" element={<DriverPage />} />

        {/* Ruta Privada / Exclusiva de la Central de Monitoreo y Operadores */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/panel" element={<AdminPage />} />

        {/* Ruta Opcional para vista dual de prueba */}
        <Route path="/demo" element={<DemoSplitPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

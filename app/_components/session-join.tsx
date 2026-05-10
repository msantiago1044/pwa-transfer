'use client';

import { useState } from 'react';
import { Scan } from 'lucide-react';
import QRScanner from './qr-scanner';
import { isValidSessionId } from '@/lib/session-utils';

interface SessionJoinProps {
  onSessionJoined: (sessionId: string) => void;
}

export default function SessionJoin({ onSessionJoined }: SessionJoinProps) {
  const [manualInput, setManualInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleManualInput() {
    const trimmedInput = manualInput.trim().toUpperCase();
    
    if (!trimmedInput) {
      setError('Por favor ingresa un codigo');
      return;
    }

    if (!isValidSessionId(trimmedInput)) {
      setError('Codigo invalido. Debe tener 8 caracteres');
      return;
    }

    setError(null);
    onSessionJoined(trimmedInput);
  }

  function handleScanSuccess(sessionId: string) {
    if (isValidSessionId(sessionId)) {
      setError(null);
      onSessionJoined(sessionId);
    } else {
      setError('Codigo QR invalido');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Conectar</h1>
          <p className="text-gray-600">Escanea el codigo QR o ingresa el codigo manualmente</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {showScanner ? (
            <div className="space-y-4">
              <QRScanner onScanSuccess={handleScanSuccess} />
              <button
                onClick={() => setShowScanner(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl"
              >
                Ingresar codigo manualmente
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Codigo de sesion:</label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => {
                    setManualInput(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleManualInput();
                  }}
                  placeholder="Ej: ABC12345"
                  maxLength={8}
                  className="w-full px-4 py-3 text-center text-2xl font-mono border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <button
                onClick={handleManualInput}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl"
              >
                Conectar
              </button>

              <button
                onClick={() => setShowScanner(true)}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl"
              >
                <Scan size={20} />
                Escanear codigo QR
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
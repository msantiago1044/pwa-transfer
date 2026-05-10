// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/lib/supabase-client';
import { generateSessionId, getExpirationTime } from '@/lib/session-utils';

interface SessionCreatorProps {
  onSessionCreated: (sessionId: string) => void;
}

export default function SessionCreator({ onSessionCreated }: SessionCreatorProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createSession();
  }, []);

  async function createSession() {
    try {
      setLoading(true);
      setError(null);
      const newSessionId = generateSessionId();
      const expiresAt = getExpirationTime();

      const { error: dbError } = await supabase.from('sessions').insert({
        session_code: newSessionId,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      if (dbError) throw dbError;
      setSessionId(newSessionId);
      onSessionCreated(newSessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-gray-600 font-medium">Preparando sesion...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Transferencia Sin Limites</h1>
          <p className="text-gray-600">Conecta tu PC y movil para compartir al instante</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-md">
              <QRCodeCanvas value={sessionId} level="H" size={200} includeMargin={true} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">Tu codigo de sesion:</p>
            <p className="text-3xl font-bold text-center text-blue-600 font-mono">{sessionId}</p>
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl mb-4"
          >
            <Copy className="inline mr-2" size={20} />
            {copied ? 'Copiado!' : 'Copiar codigo'}
          </button>
        </div>
      </div>
    </div>
  );
}
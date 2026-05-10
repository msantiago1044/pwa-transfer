'use client';

import { useState, useEffect } from 'react';
import SessionCreator from './session-creator';
import SessionJoin from './session-join';
import ChatInterface from './chat-interface';

type Stage = 'mode-select' | 'create-session' | 'join-session' | 'chat';

export default function AppRoot() {
  const [stage, setStage] = useState<Stage>('mode-select');
  const [sessionId, setSessionId] = useState<string>('');

  // Auto-join if URL contains ?join=CODIGO (from QR scan)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && joinCode.length === 8) {
      setSessionId(joinCode.toUpperCase());
      setStage('chat');
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function handleSessionCreated(id: string) {
    setSessionId(id);
    setStage('chat');
  }

  function handleSessionJoined(id: string) {
    setSessionId(id);
    setStage('chat');
  }

  function handleExit() {
    setSessionId('');
    setStage('mode-select');
  }

  if (stage === 'create-session') return <SessionCreator onSessionCreated={handleSessionCreated} />;
  if (stage === 'join-session') return <SessionJoin onSessionJoined={handleSessionJoined} />;
  if (stage === 'chat') return <ChatInterface sessionId={sessionId} onExit={handleExit} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Transferencia</h1>
          <p className="text-gray-600 text-lg">Compartir sin limites entre dispositivos</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-4">
          <button
            onClick={() => setStage('create-session')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl text-lg transition shadow-md hover:shadow-lg"
          >
            Crear Sesion (PC)
          </button>
          <button
            onClick={() => setStage('join-session')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl text-lg transition shadow-md hover:shadow-lg"
          >
            Conectar a Sesion (Movil)
          </button>
        </div>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Crea una sesion en tu PC y conectate desde tu movil</p>
          <p>Usa codigos QR o ingresa manualmente</p>
        </div>
      </div>
    </div>
  );
}

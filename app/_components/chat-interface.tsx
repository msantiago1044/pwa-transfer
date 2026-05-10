// @ts-nocheck
'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Trash2, LogOut, File } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { isFileSizeValid, formatFileSize, isImageFile, compressImage } from '@/lib/file-utils';

interface Message {
  id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  onExit: () => void;
}

export default function ChatInterface({ sessionId, onExit }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_code=eq.${sessionId}` },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe().catch(console.error);
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  async function loadMessages() {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_code', sessionId)
        .order('created_at', { ascending: true });

      if (dbError) throw dbError;
      setMessages(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function sendTextMessage() {
    if (!textInput.trim()) return;

    try {
      setError(null);
      const { error: dbError } = await supabase.from('messages').insert({
        session_code: sessionId,
        content: textInput.trim(),
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;
      setTextInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error sending';
      setError(message);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploading(true);

      if (!isFileSizeValid(file.size)) {
        setError('Archivo muy grande. Maximo 50MB');
        return;
      }

      let fileToUpload = file;

      if (isImageFile(file)) {
        const compressed = await compressImage(file);
        fileToUpload = new File([compressed], file.name, { type: 'image/jpeg' });
      }

      const timestamp = Date.now();
      const storagePath = `${sessionId}/${timestamp}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from('file-transfers')
        .upload(storagePath, fileToUpload);

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from('file-transfers')
        .getPublicUrl(storagePath);

      const { error: dbError } = await supabase.from('messages').insert({
        session_code: sessionId,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: fileToUpload.size,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error uploading';
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  async function clearMessages() {
    if (!confirm('Eliminar todos los mensajes?')) return;

    try {
      setError(null);
      const { error: dbError } = await supabase
        .from('messages')
        .delete()
        .eq('session_code', sessionId);

      if (dbError) throw dbError;
      setMessages([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting';
      setError(message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <p className="text-gray-600">Cargando sesion...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transferencia Activa</h1>
            <p className="text-sm text-gray-600">Codigo: <span className="font-mono font-bold text-blue-600">{sessionId}</span></p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearMessages}
              className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-4xl mb-2">💬</p>
              <p className="font-medium">Sin mensajes aun</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md"
            >
              {msg.content && (
                <p className="text-gray-900 break-words">{msg.content}</p>
              )}

              {msg.file_url && (
                <div className="mt-3">
                  {msg.file_type?.startsWith('image/') ? (
                    <div className="rounded-xl overflow-hidden bg-gray-100 max-w-xs">
                      <img
                        src={msg.file_url}
                        alt={msg.file_name || 'Image'}
                        className="w-full h-auto"
                      />
                    </div>
                  ) : (
                    <a
                      href={msg.file_url}
                      download={msg.file_name || 'download'}
                      className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-4 py-3 rounded-xl w-fit"
                    >
                      <File size={20} />
                      <div className="text-left">
                        <p className="text-sm">{msg.file_name}</p>
                        <p className="text-xs">{formatFileSize(msg.file_size || 0)}</p>
                      </div>
                    </a>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold p-3 rounded-xl disabled:opacity-50"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTextMessage();
              }
            }}
            placeholder="Escribe un mensaje..."
            disabled={uploading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || uploading}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white font-semibold p-3 rounded-xl disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        {uploading && (
          <p className="text-sm text-gray-600 mt-2 text-center">Subiendo archivo...</p>
        )}
      </div>
    </div>
  );
}
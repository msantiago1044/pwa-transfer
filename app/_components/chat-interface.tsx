// @ts-nocheck
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Trash2, LogOut, File, Download, Eye, QrCode, X, Copy } from 'lucide-react';
import dynamic from 'next/dynamic';
const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });
import { supabase } from '@/lib/supabase-client';
import { isFileSizeValid, formatFileSize, isImageFile, compressImage } from '@/lib/file-utils';

interface Message {
  id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  device_name: string | null;
  created_at: string;
}

interface PendingFile {
  file: File;
  previewUrl: string | null;
}

interface ChatInterfaceProps {
  sessionId: string;
  onExit: () => void;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) {
    const match = ua.match(/Android.*?;\s([^)]+)\)/);
    return match ? match[1].trim() : 'Android';
  }
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Dispositivo';
}

export default function ChatInterface({ sessionId, onExit }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deviceName = useRef(getDeviceName());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}?join=${sessionId}`);
    }
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_code=eq.${sessionId}` },
        (payload: any) => { setMessages((prev) => [...prev, payload.new as Message]); scrollToBottom(); }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `session_code=eq.${sessionId}` },
        (payload: any) => { setMessages((prev) => prev.filter((m) => m.id !== payload.old.id)); }
      )
      .subscribe();
    return () => { channel.unsubscribe().catch(console.error); };
  }, [sessionId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  function scrollToBottom() {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 0);
  }

  async function loadMessages() {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('messages').select('*').eq('session_code', sessionId).order('created_at', { ascending: true });
      if (dbError) throw dbError;
      setMessages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading');
    } finally {
      setLoading(false);
    }
  }

  function stageFile(file: File) {
    const isImage = file.type.startsWith('image/');
    setPendingFile({ file, previewUrl: isImage ? URL.createObjectURL(file) : null });
  }

  function clearPendingFile() {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSend() {
    if (!textInput.trim() && !pendingFile) return;
    try {
      setError(null);
      setUploading(true);

      if (pendingFile) {
        const { file } = pendingFile;
        if (!isFileSizeValid(file.size)) { setError('Archivo muy grande. Maximo 50MB'); return; }

        let fileToUpload = file;
        if (isImageFile(file)) {
          const compressed = await compressImage(file);
          fileToUpload = new File([compressed], file.name, { type: 'image/jpeg' });
        }

        const storagePath = `${sessionId}/${Date.now()}-${file.name}`;
        const { error: storageError } = await supabase.storage.from('file-transfers').upload(storagePath, fileToUpload);
        if (storageError) throw storageError;

        const { data: publicUrlData } = supabase.storage.from('file-transfers').getPublicUrl(storagePath);

        const { error: dbError } = await supabase.from('messages').insert({
          session_code: sessionId,
          content: textInput.trim() || null,
          file_url: publicUrlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: fileToUpload.size,
          device_name: deviceName.current,
          created_at: new Date().toISOString(),
        });
        if (dbError) throw dbError;
        clearPendingFile();
      } else {
        const { error: dbError } = await supabase.from('messages').insert({
          session_code: sessionId,
          content: textInput.trim(),
          device_name: deviceName.current,
          created_at: new Date().toISOString(),
        });
        if (dbError) throw dbError;
      }

      setTextInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending');
    } finally {
      setUploading(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) stageFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) stageFile(file);
  }, []);

  async function deleteMessage(msg: Message) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    try {
      setDeletingId(msg.id);
      if (msg.file_url) {
        const urlPath = msg.file_url.split('/file-transfers/')[1];
        if (urlPath) await supabase.storage.from('file-transfers').remove([decodeURIComponent(urlPath)]);
      }
      const { error: dbError } = await supabase.from('messages').delete().eq('id', msg.id);
      if (dbError) throw dbError;
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting');
    } finally {
      setDeletingId(null);
    }
  }

  async function clearMessages() {
    if (!confirm('¿Eliminar todos los mensajes?')) return;
    try {
      const { error: dbError } = await supabase.from('messages').delete().eq('session_code', sessionId);
      if (dbError) throw dbError;
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting');
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <p className="text-gray-600">Cargando sesion...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-blue-50 relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <p className="text-2xl font-bold text-blue-600">Suelta el archivo aqui</p>
            <p className="text-gray-500 mt-1">Se añadirá a la casilla de envío</p>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Unirse a esta sesion</h2>
              <button onClick={() => setShowQR(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Escanea para unirte directo al chat</p>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-2xl shadow-md">
                <QRCodeCanvas value={joinUrl || sessionId} level="H" size={200} includeMargin={true} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Codigo de sesion:</p>
            <p className="text-3xl font-bold text-blue-600 font-mono mb-4">{sessionId}</p>
            <button onClick={copyCode} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              <Copy size={18} />
              {copied ? '¡Copiado!' : 'Copiar codigo'}
            </button>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewUrl && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setPreviewUrl(null)}><X size={24} /></button>
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transferencia Activa</h1>
            <p className="text-sm text-gray-600">Codigo: <span className="font-mono font-bold text-blue-600">{sessionId}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-lg">
              <QrCode size={18} /><span className="hidden sm:inline">QR</span>
            </button>
            <button onClick={clearMessages} className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg">
              <Trash2 size={18} /><span className="hidden sm:inline">Limpiar</span>
            </button>
            <button onClick={onExit} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg">
              <LogOut size={18} /><span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-semibold">Error:</p><p className="text-sm">{error}</p>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-4xl mb-2">💬</p>
              <p className="font-medium">Sin mensajes aun</p>
              <p className="text-sm mt-1 text-gray-400">Arrastra archivos o escribe un mensaje</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow group relative ${deletingId === msg.id ? 'opacity-40' : ''}`}>
              {/* Per-message delete */}
              <button
                onClick={() => deleteMessage(msg)}
                disabled={deletingId === msg.id}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <X size={16} />
              </button>

              {msg.device_name && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full mb-2">
                  📱 {msg.device_name}
                </span>
              )}

              {msg.content && <p className="text-gray-900 break-words pr-6">{msg.content}</p>}

              {msg.file_url && (
                <div className="mt-2">
                  {msg.file_type?.startsWith('image/') ? (
                    <div className="rounded-xl overflow-hidden bg-gray-100 max-w-xs relative group/img cursor-pointer" onClick={() => setPreviewUrl(msg.file_url)}>
                      <img src={msg.file_url} alt={msg.file_name || 'Image'} className="w-full h-auto" />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover/img:opacity-100">
                        <button onClick={e => { e.stopPropagation(); setPreviewUrl(msg.file_url); }} className="bg-white rounded-full p-2 shadow hover:bg-gray-100"><Eye size={18} /></button>
                        <a href={msg.file_url} download={msg.file_name || 'image'} onClick={e => e.stopPropagation()} className="bg-white rounded-full p-2 shadow hover:bg-gray-100"><Download size={18} /></a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 w-fit max-w-xs">
                      <File size={22} className="text-blue-600 flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-blue-800 truncate">{msg.file_name}</p>
                        <p className="text-xs text-blue-600">{formatFileSize(msg.file_size || 0)}</p>
                      </div>
                      <a href={msg.file_url} download={msg.file_name || 'download'} className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2"><Download size={16} /></a>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">{new Date(msg.created_at).toLocaleTimeString()}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Staged file preview */}
        {pendingFile && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 w-fit max-w-full">
              {pendingFile.previewUrl
                ? <img src={pendingFile.previewUrl} alt="preview" className="h-12 w-12 object-cover rounded-lg flex-shrink-0" />
                : <File size={22} className="text-blue-600 flex-shrink-0" />
              }
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-800 truncate">{pendingFile.file.name}</p>
                <p className="text-xs text-blue-600">{formatFileSize(pendingFile.file.size)}</p>
              </div>
              <button onClick={clearPendingFile} className="flex-shrink-0 text-gray-400 hover:text-red-500 ml-2"><X size={18} /></button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileInputChange} disabled={uploading} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl disabled:opacity-50">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={pendingFile ? 'Añade un mensaje (opcional)...' : 'Escribe un mensaje...'}
            disabled={uploading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={(!textInput.trim() && !pendingFile) || uploading}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white font-semibold p-3 rounded-xl disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        {uploading && <p className="text-sm text-blue-600 mt-2 text-center font-medium">Enviando...</p>}
      </div>
    </div>
  );
}

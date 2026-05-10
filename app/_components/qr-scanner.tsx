'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (sessionId: string) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        const scanner = new Html5QrcodeScanner('qr-scanner', {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        }, false);

        scanner.render(
          (decodedText: string) => {
            const sessionId = decodedText.split('/').pop() || decodedText;
            onScanSuccess(sessionId);
            scanner.clear().catch(console.error);
          },
          (error: any) => {
            console.error('QR scan error:', error);
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        setError(message);
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p className="text-red-700 font-semibold">No se puede acceder a la camara</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id="qr-scanner" className="rounded-xl overflow-hidden shadow-lg"></div>
    </div>
  );
}
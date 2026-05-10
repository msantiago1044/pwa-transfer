'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch((error) => console.error('Error registrando SW:', error));
    }

    let deferredPrompt: any;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA instalada');
    });
  }, []);

  return null;
}
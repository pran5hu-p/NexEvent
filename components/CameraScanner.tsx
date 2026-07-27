'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface RealCameraScannerProps {
  eventId: string;
  isPaused: boolean;
  onScanSuccess: (decodedText: string) => void;
}

export default function RealCameraScanner({ eventId, isPaused, onScanSuccess }: RealCameraScannerProps) {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    const scannerId = `reader-${eventId}`;
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerInstanceRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        if (!isScanningRef.current && !isPaused) {
          isScanningRef.current = true;

          let cleanId = decodedText.trim();
          try {
            if (cleanId.startsWith('http://') || cleanId.startsWith('https://')) {
              const urlParts = cleanId.split('/');
              cleanId = urlParts[urlParts.length - 1];
            } else if (cleanId.startsWith('{') && cleanId.endsWith('}')) {
              const parsed = JSON.parse(cleanId);
              cleanId = parsed.id || parsed.registrationId || cleanId;
            }
          } catch (e) {}

          onScanSuccess(cleanId);
          
          setTimeout(() => {
            isScanningRef.current = false;
          }, 2000);
        }
      },
      () => {}
    )
    .then(() => {
      setScannerStarted(true);
    })
    .catch((err) => {
      console.error('Camera start error:', err);
      setScanError('Unable to access camera. Please allow camera permissions.');
    });

    return () => {
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().then(() => {
              scannerInstanceRef.current?.clear();
            }).catch(() => {});
          } else {
            scannerInstanceRef.current.clear();
          }
        } catch (e) {}
      }
    };
  }, [eventId, isPaused, onScanSuccess]);

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center relative">
      <h3 className="text-lg font-bold text-white mb-4">Live Camera Scanner</h3>
      
      {scanError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm mb-4">
          {scanError}
        </div>
      )}

      <div className="relative">
        <div id={`reader-${eventId}`} className="overflow-hidden rounded-xl border border-neutral-800 bg-black min-h-[250px]"></div>
        
        {isPaused && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-4 z-10">
            <p className="text-yellow-400 font-bold mb-2">Scanner Paused</p>
            <p className="text-xs text-neutral-400">Review check-in status below</p>
          </div>
        )}
      </div>

      {!scannerStarted && !scanError && (
        <p className="text-neutral-400 text-sm mt-4 animate-pulse">Initializing camera stream...</p>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import RealCameraScanner from '@/components/CameraScanner';
import Link from 'next/link';

interface ScannedAttendee {
  id: string;
  name: string;
  checkedInAt: string;
}

export default function ScannerPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; attendeeName?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  const [checkedInAttendees, setCheckedInAttendees] = useState<ScannedAttendee[]>([]);

  const handleScan = async (registrationId: string) => {
    if (isProcessing || isScannerPaused) return;
    setIsProcessing(true);
    setIsScannerPaused(true); // Pause scanner immediately on first read

    try {
      const res = await fetch(`/api/registration/${registrationId}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setScanResult({
          success: false,
          message: data.message || 'Check-in failed',
          attendeeName: data.attendeeName,
        });
        return;
      }

      const attendeeName = data.registration?.user?.name || data.attendeeName || 'Attendee';

      setScanResult({
        success: true,
        message: 'Checked in successfully!',
        attendeeName,
      });

      setCheckedInAttendees((prev) => {
        const exists = prev.some((item) => item.id === registrationId);
        if (exists) return prev;
        return [
          {
            id: registrationId,
            name: attendeeName,
            checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev,
        ];
      });

    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.message || 'Invalid ticket',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetScanner = () => {
    setScanResult(null);
    setIsScannerPaused(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href={`/dashboard/organizer`} className="text-neutral-400 hover:text-white mb-6 inline-block transition text-sm">
        ← Back to Organizer Dashboard
      </Link>

      <h1 className="text-3xl font-extrabold text-white mb-8 text-center">Event Ticket Check-In</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Camera View */}
        <RealCameraScanner eventId={eventId} isPaused={isScannerPaused} onScanSuccess={handleScan} />

        {/* Live Feedback Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-[320px] text-center">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Scan Status</h3>

            {isProcessing ? (
              <p className="text-yellow-400 font-semibold animate-pulse py-10">Verifying ticket...</p>
            ) : scanResult ? (
              <div className={`p-6 rounded-xl border ${scanResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                <p className="text-lg font-bold mb-1">{scanResult.success ? '✓ Valid Ticket' : '✕ Notice'}</p>
                <p className="text-sm text-neutral-300">{scanResult.message}</p>
                {scanResult.attendeeName && (
                  <p className="text-sm font-bold text-white mt-2">Attendee: {scanResult.attendeeName}</p>
                )}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm py-10">Position a user ticket QR code inside the camera frame to scan.</p>
            )}
          </div>

          {isScannerPaused && (
            <button
              onClick={handleResetScanner}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg mt-4"
            >
              Scan Next Ticket
            </button>
          )}
        </div>
      </div>

      {/* Persistent Log Feed of Scanned Attendees */}
      <div className="mt-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Check-Ins</h3>
          <span className="bg-neutral-800 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
            {checkedInAttendees.length} Checked In
          </span>
        </div>

        {checkedInAttendees.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-6">No tickets scanned yet during this session.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {checkedInAttendees.map((attendee) => (
              <div key={attendee.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-bold flex items-center justify-center text-sm">
                    {attendee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{attendee.name}</p>
                    <p className="text-xs text-neutral-500">Ticket ID: {attendee.id.slice(0, 10)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold bg-green-500/10 text-green-400 px-2.5 py-1 rounded-md border border-green-500/20">
                    {attendee.checkedInAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
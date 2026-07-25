'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';

export default function LiveCheckins({ eventId }: { eventId: string }) {
  const { connect, joinEvent, disconnect, checkins } = useSocketStore();

  useEffect(() => {
    connect();
    joinEvent(eventId);

    // Cleanup when the organizer leaves the page
    return () => disconnect();
  }, [eventId, connect, joinEvent, disconnect]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Check-ins</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-neutral-400">Live</span>
        </div>
      </div>
      
      <ul className="space-y-3 max-h-96 overflow-y-auto">
        {checkins.length === 0 ? (
          <li className="text-neutral-500 text-sm italic">Waiting for attendees to check in...</li>
        ) : (
          checkins.map((c) => (
            <li key={c.id} className="bg-neutral-800 rounded-lg p-3 text-sm text-neutral-300 flex justify-between items-center">
              <span>Attendee scanned ticket</span>
              <span className="text-xs text-neutral-500">
                {new Date(c.checkedInAt).toLocaleTimeString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
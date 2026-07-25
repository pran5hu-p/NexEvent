import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface CheckinPayload {
  id: string;
  status: string;
  checkedInAt: string;
}

interface SocketState {
  socket: Socket | null;
  announcements: string[];
  checkins: CheckinPayload[];
  connect: () => void;
  joinEvent: (eventId: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  announcements: [],
  checkins: [],
  
  connect: () => {
    if (get().socket) return; // Prevent duplicate connections
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    socket.on('announcement', (msg: string) =>
      set((s) => ({ announcements: [msg, ...s.announcements] }))
    );

    socket.on('checkin', (payload: CheckinPayload) =>
      set((s) => ({ checkins: [payload, ...s.checkins] }))
    );

    set({ socket });
  },
  
  joinEvent: (eventId) => {
    get().socket?.emit('join:event', eventId);
  },
  
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, checkins: [], announcements: [] });
  }
}));
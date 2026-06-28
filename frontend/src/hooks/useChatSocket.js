import { useEffect, useState } from 'react';
import socket from '../services/socketService';

/** Live connection status: 'connected' | 'reconnecting' | 'disconnected'. */
export function useSocketStatus() {
    const [status, setStatus] = useState(socket.status);
    useEffect(() => socket.onStatus(setStatus), []);
    return status;
}

/**
 * Subscribe to a socket frame type for the lifetime of the component.
 * IMPORTANT: wrap `handler` in useCallback or it resubscribes every render.
 */
export function useSocketEvent(type, handler) {
    useEffect(() => socket.on(type, handler), [type, handler]);
}

import { API_ENDPOINTS } from '../constants/config';
import { tokenStore } from './api';

const BACKOFF_BASE_MS = 1000;
const BACKOFF_CAP_MS = 30000;

/**
 * One WebSocket per authenticated session.
 * Frames in/out follow the protocol in the websocket design spec:
 * out: {type:'message'|'typing'|'read', conversation_id, ...}
 * in:  {type:'message'|'typing'|'read'|'presence'|'error', ...}
 */
class SocketService {
    constructor() {
        this.ws = null;
        this.handlers = new Map(); // frame type -> Set<fn>
        this.statusHandlers = new Set();
        this.status = 'disconnected'; // 'connected' | 'reconnecting' | 'disconnected'
        this.shouldRun = false;
        this.attempt = 0;
        this.reconnectTimer = null;
    }

    connect() {
        if (this.shouldRun) return;
        this.shouldRun = true;
        this.attempt = 0;
        this._open();
    }

    disconnect() {
        this.shouldRun = false;
        clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
        this._emitStatus('disconnected');
    }

    _open() {
        const token = tokenStore.getAccess();
        if (!token) return;
        this.ws = new WebSocket(API_ENDPOINTS.WEBSOCKET(token));

        this.ws.onopen = () => {
            this.attempt = 0;
            this._emitStatus('connected');
        };

        this.ws.onmessage = (event) => {
            let frame;
            try {
                frame = JSON.parse(event.data);
            } catch {
                return; // malformed frame must never break the UI
            }
            const fns = this.handlers.get(frame.type);
            if (!fns) return;
            fns.forEach((fn) => {
                try {
                    fn(frame);
                } catch (err) {
                    console.error('socket handler failed', err);
                }
            });
        };

        this.ws.onclose = () => {
            if (this.shouldRun) this._scheduleReconnect();
        };

        this.ws.onerror = () => {
            this.ws?.close();
        };
    }

    _scheduleReconnect() {
        this._emitStatus('reconnecting');
        const delay = Math.min(BACKOFF_BASE_MS * 2 ** this.attempt, BACKOFF_CAP_MS);
        this.attempt += 1;
        this.reconnectTimer = setTimeout(() => this._open(), delay);
    }

    /** Subscribe to a frame type. Returns an unsubscribe function. */
    on(type, fn) {
        if (!this.handlers.has(type)) this.handlers.set(type, new Set());
        this.handlers.get(type).add(fn);
        return () => this.handlers.get(type)?.delete(fn);
    }

    onStatus(fn) {
        this.statusHandlers.add(fn);
        return () => this.statusHandlers.delete(fn);
    }

    _emitStatus(status) {
        this.status = status;
        this.statusHandlers.forEach((fn) => fn(status));
    }

    _send(frame) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(frame));
            return true;
        }
        return false;
    }

    sendMessage(conversationId, content) {
        return this._send({ type: 'message', conversation_id: conversationId, content });
    }

    sendTyping(conversationId, isTyping) {
        return this._send({ type: 'typing', conversation_id: conversationId, is_typing: isTyping });
    }

    sendRead(conversationId) {
        return this._send({ type: 'read', conversation_id: conversationId });
    }
}

export default new SocketService();

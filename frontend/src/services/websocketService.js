import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

/**
 * WebSocket Service for real-time messaging
 */
class WebSocketService {
    constructor() {
        this.ws = null;
        this.messageHandlers = [];
    }

    /**
     * Connect to WebSocket
     */
    connect() {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            console.error('No token found for WebSocket connection');
            return;
        }

        this.ws = new WebSocket(API_ENDPOINTS.WEBSOCKET.CONNECT(token));

        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
        };
    }

    /**
     * Send message through WebSocket
     */
    sendMessage(receiverId, message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const payload = {
                receiver_id: receiverId,
                message: message,
            };
            this.ws.send(JSON.stringify(payload));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    /**
     * Add message handler
     */
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    /**
     * Remove message handler
     */
    offMessage(handler) {
        this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.messageHandlers = [];
        }
    }
}

export default new WebSocketService();

// API Configuration
export const API_BASE_URL = 'http://localhost:8000';
export const WS_BASE_URL = 'ws://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
    // Health & System
    HEALTH: {
        ROOT: '/',
        CLEAR_DB: '/clear-mysql',
    },

    // Authentication
    AUTH: {
        LOGIN: '/login',
        REGISTER: '/register',
    },

    // Users
    USERS: {
        GET_ALL: (username) => `/user_lists/all_users/${username}`,
        GET_CHAT_USERS: (username) => `/user_lists/chat_user/${username}`,
    },

    // Messages
    MESSAGES: {
        GET_HISTORY: (userId, contactId) => `/messages/${userId}/${contactId}`,
    },

    // WebSocket
    WEBSOCKET: {
        CONNECT: (token) => `${WS_BASE_URL}/ws/${token}`,
    },
};

// Local Storage Keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USERNAME: 'username',
    USER_ID: 'userId',
};

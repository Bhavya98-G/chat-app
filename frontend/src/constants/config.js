// API Configuration
export const API_BASE_URL = 'http://localhost:8000';
export const WS_BASE_URL = 'ws://localhost:8000';

// API Endpoints (must match the backend contract — see websocket design spec)
export const API_ENDPOINTS = {
    HEALTH: '/health',

    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        GENERATE_OTP: '/auth/generate_otp',
        RESET_PASSWORD: '/auth/reset_password',
    },

    CHAT: {
        CONVERSATIONS: '/conversations',
        MESSAGES: (conversationId) => `/conversations/${conversationId}/messages`,
        USER_SEARCH: '/users/search',
        BOT: '/bot',
    },

    GENERAL: {
        CREATE_CONTACT: '/general/create_contact',
        ALL_CONTACTS: '/general/all_contact',
        CONTACT: (id) => `/general/contact/${id}`,
        CHANGE_NICKNAME: '/general/change_nickname',
        BLOCK_PERSON: '/general/block_person',
        DELETE_CONTACT: (id) => `/general/delete_contact/${id}`,
        ADD_NUMBER: '/general/add_number',
        UPDATE_NUMBER: '/general/update_number',
        DELETE_NUMBER: '/general/delete_number',
        ADD_BIO: '/general/add_bio',
        UPDATE_BIO: '/general/update_bio',
        DELETE_BIO: '/general/delete_bio',
    },

    WEBSOCKET: (token) => `${WS_BASE_URL}/ws/${token}`,
};

// Local Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
};

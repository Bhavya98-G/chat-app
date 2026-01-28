import { STORAGE_KEYS } from '../constants/config';

/**
 * Storage utility functions
 */
export const storage = {
    /**
     * Get item from localStorage
     */
    get: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    /**
     * Set item in localStorage
     */
    set: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    },

    /**
     * Remove item from localStorage
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    },

    /**
     * Clear all auth-related data
     */
    clearAuth: () => {
        storage.remove(STORAGE_KEYS.TOKEN);
        storage.remove(STORAGE_KEYS.USERNAME);
        storage.remove(STORAGE_KEYS.USER_ID);
    },
};

/**
 * Format timestamp to readable time
 */
export const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format message for display
 */
export const formatMessage = (message, currentUserId, contactUsername) => {
    return {
        sender: message.sender_id === currentUserId ? 'Me' : contactUsername,
        message: message.content,
        time: formatTime(message.timestamp),
        type: message.sender_id === currentUserId ? 'outgoing' : 'incoming',
    };
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    const token = storage.get(STORAGE_KEYS.TOKEN);
    const username = storage.get(STORAGE_KEYS.USERNAME);
    return !!(token && username);
};

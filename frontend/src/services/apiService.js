import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

/**
 * Get authorization headers with token
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

/**
 * Fetch all users
 */
export const fetchUsers = async (username) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.GET_ALL(username)}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    return response.json();
};

/**
 * Fetch chat history between two users
 */
export const fetchChatHistory = async (userId, contactId) => {
    const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.MESSAGES.GET_HISTORY(userId, contactId)}`,
        {
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch chat history');
    }

    return response.json();
};

/**
 * Login user
 */
export const loginUser = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }

    return response.json();
};

/**
 * Register user
 */
export const registerUser = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error('Registration failed');
    }

    return response.json();
};

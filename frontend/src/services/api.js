import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Automatically add the JWT token to requests if we have it
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

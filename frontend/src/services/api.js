import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

/** Normalized error every service call rejects with. */
export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const tokenStore = {
    getAccess: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    getRefresh: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    set: ({ access_token, refresh_token }) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    },
    clear: () => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    },
};

// Fired when a 401 could not be recovered by refresh — AuthContext subscribes.
const sessionExpiredListeners = new Set();
export const onSessionExpired = (fn) => {
    sessionExpiredListeners.add(fn);
    return () => sessionExpiredListeners.delete(fn);
};

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

function toApiError(response) {
    const detail = response.data?.detail;
    let message;
    if (typeof detail === 'string') {
        message = detail;
    } else if (Array.isArray(detail)) {
        // FastAPI 422 validation errors
        message = detail.map((d) => d.msg).join('; ');
    } else {
        message = `Request failed (${response.status})`;
    }
    return new ApiError(response.status, message);
}

// Single-flight refresh: concurrent 401s all await the same promise.
let refreshPromise = null;

async function refreshTokens() {
    const refresh_token = tokenStore.getRefresh();
    if (!refresh_token) throw new ApiError(401, 'No refresh token');
    // bare axios so a 401 here doesn't recurse into this interceptor
    const { data } = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        { refresh_token },
    );
    tokenStore.set(data); // rotating: both tokens replaced
    return data.access_token;
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const { response, config } = error;
        if (!response) {
            throw new ApiError(0, 'Cannot reach the server. Check your connection.');
        }
        const isAuthAttempt = config.url === API_ENDPOINTS.AUTH.LOGIN;
        if (response.status === 401 && !config._retried && !isAuthAttempt) {
            config._retried = true;
            try {
                refreshPromise = refreshPromise
                    ?? refreshTokens().finally(() => { refreshPromise = null; });
                const access = await refreshPromise;
                config.headers.Authorization = `Bearer ${access}`;
                return api(config);
            } catch {
                tokenStore.clear();
                sessionExpiredListeners.forEach((fn) => fn());
                throw new ApiError(401, 'Session expired — please log in again.');
            }
        }
        throw toApiError(response);
    },
);

export default api;

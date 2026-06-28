import api, { tokenStore } from './api';
import { API_ENDPOINTS } from '../constants/config';

export async function register({ firstName, lastName, email, password }) {
    const { data } = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        first_name: firstName,
        last_name: lastName || null,
        email,
        password,
    });
    return data;
}

export async function login(email, password) {
    const { data } = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    tokenStore.set(data);
    return data;
}

export async function fetchMe() {
    const { data } = await api.get(API_ENDPOINTS.AUTH.ME);
    return data;
}

/** Email a 6-digit OTP to the given address (used by password reset). */
export async function generateOtp(email) {
    const { data } = await api.post(API_ENDPOINTS.AUTH.GENERATE_OTP, { email });
    return data;
}

/** Reset the password using the emailed OTP. */
export async function resetPassword(email, otp, newPassword) {
    const { data } = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        email,
        otp: Number(otp),
        new_password: newPassword,
    });
    return data;
}

export async function logout() {
    const refresh_token = tokenStore.getRefresh();
    try {
        if (refresh_token) await api.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh_token });
    } catch {
        // best-effort revocation; clearing local state matters more
    }
    tokenStore.clear();
}

import api from './api';
import { API_ENDPOINTS } from '../constants/config';

// The backend splits add (create) and update; pick based on whether the user
// already has a value. `hasBio` / `hasPhone` come from the enriched /auth/me.

export async function setBio(bio, hasBio) {
    const ep = hasBio ? API_ENDPOINTS.GENERAL.UPDATE_BIO : API_ENDPOINTS.GENERAL.ADD_BIO;
    const { data } = await api[hasBio ? 'patch' : 'post'](ep, { bio });
    return data;
}

export async function clearBio() {
    const { data } = await api.delete(API_ENDPOINTS.GENERAL.DELETE_BIO);
    return data;
}

export async function setPhone(phoneNumber, hasPhone) {
    const ep = hasPhone ? API_ENDPOINTS.GENERAL.UPDATE_NUMBER : API_ENDPOINTS.GENERAL.ADD_NUMBER;
    const { data } = await api[hasPhone ? 'patch' : 'post'](ep, { phone_number: phoneNumber });
    return data;
}

export async function clearPhone() {
    const { data } = await api.delete(API_ENDPOINTS.GENERAL.DELETE_NUMBER);
    return data;
}

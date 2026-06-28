import api from './api';
import { API_ENDPOINTS } from '../constants/config';

/** Saved contacts: [{ contact_id, nickname, first_name, last_name, is_blocked }]. */
export async function listContacts() {
    const { data } = await api.get(API_ENDPOINTS.GENERAL.ALL_CONTACTS);
    return data;
}

/** Full profile: { nickname, first_name, last_name, email, phone_number, bio, created_at }. */
export async function getContact(contactId) {
    const { data } = await api.get(API_ENDPOINTS.GENERAL.CONTACT(contactId));
    return data;
}

export async function createContact(contactId, nickname) {
    const { data } = await api.post(API_ENDPOINTS.GENERAL.CREATE_CONTACT, {
        contact_id: contactId,
        nickname,
    });
    return data;
}

export async function changeNickname(contactId, nickname) {
    const { data } = await api.patch(API_ENDPOINTS.GENERAL.CHANGE_NICKNAME, {
        contact_id: contactId,
        nickname,
    });
    return data;
}

export async function setBlocked(contactId, isBlocked) {
    const { data } = await api.patch(API_ENDPOINTS.GENERAL.BLOCK_PERSON, {
        contact_id: contactId,
        is_blocked: isBlocked,
    });
    return data;
}

export async function deleteContact(contactId) {
    const { data } = await api.delete(API_ENDPOINTS.GENERAL.DELETE_CONTACT(contactId));
    return data;
}

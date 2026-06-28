import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export async function searchUsers(q) {
    const { data } = await api.get(API_ENDPOINTS.CHAT.USER_SEARCH, { params: { q } });
    return data;
}

export async function listConversations() {
    const { data } = await api.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
    return data;
}

/** Idempotent get-or-create; returns the conversation id. */
export async function openConversation(peerId) {
    const { data } = await api.post(API_ENDPOINTS.CHAT.CONVERSATIONS, { peer_id: peerId });
    return data.conversation_id;
}

export async function getMessages(conversationId) {
    const { data } = await api.get(API_ENDPOINTS.CHAT.MESSAGES(conversationId));
    return data;
}

/** The Texter Bot user ({ id, first_name, last_name, email }); hidden from search. */
export async function getBot() {
    const { data } = await api.get(API_ENDPOINTS.CHAT.BOT);
    return data;
}

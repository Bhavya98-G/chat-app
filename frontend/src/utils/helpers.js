/** "10:42 AM" from an ISO timestamp; empty string for null/invalid. */
export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Human name for a user object from the API. */
export const displayName = (user) =>
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Unknown';

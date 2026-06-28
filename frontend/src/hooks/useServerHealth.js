import { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/config';

const useServerHealth = (url = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, intervalMs = 3000) => {
    const [isServerUp, setIsServerUp] = useState(true);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    setIsServerUp(true);
                } else {
                    setIsServerUp(false);
                }
            } catch (error) {
                setIsServerUp(false);
            }
        };

        // Check immediately
        checkHealth();

        // Then poll
        const intervalId = setInterval(checkHealth, intervalMs);

        return () => clearInterval(intervalId);
    }, [url, intervalMs]);

    return isServerUp;
};

export default useServerHealth;

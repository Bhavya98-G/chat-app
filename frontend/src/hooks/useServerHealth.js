import { useState, useEffect } from 'react';

const useServerHealth = (url = 'http://127.0.0.1:8000/health', intervalMs = 3000) => {
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

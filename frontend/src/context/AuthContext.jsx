import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { tokenStore, onSessionExpired } from '../services/api';
import socket from '../services/socketService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('booting'); // 'booting' | 'authenticated' | 'anonymous'

    const logout = useCallback(async () => {
        socket.disconnect();
        await authService.logout();
        setUser(null);
        setStatus('anonymous');
    }, []);

    // Unrecoverable 401 anywhere -> back to login.
    useEffect(() => onSessionExpired(() => {
        socket.disconnect();
        setUser(null);
        setStatus('anonymous');
    }), []);

    // Boot: resume session from stored tokens.
    useEffect(() => {
        (async () => {
            if (!tokenStore.getAccess()) {
                setStatus('anonymous');
                return;
            }
            try {
                const me = await authService.fetchMe();
                setUser(me);
                setStatus('authenticated');
            } catch {
                tokenStore.clear();
                setStatus('anonymous');
            }
        })();
    }, []);

    // The session socket lives exactly as long as the user is authenticated.
    useEffect(() => {
        if (status !== 'authenticated') return undefined;
        socket.connect();
        return () => socket.disconnect();
    }, [status]);

    const login = useCallback(async (email, password) => {
        await authService.login(email, password);
        const me = await authService.fetchMe();
        setUser(me);
        setStatus('authenticated');
        return me;
    }, []);

    const signup = useCallback(async (fields) => {
        await authService.register(fields);
        return login(fields.email, fields.password);
    }, [login]);

    return (
        <AuthContext.Provider value={{ user, status, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

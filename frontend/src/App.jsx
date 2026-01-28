import React, { useState, useEffect } from 'react';
import { Login, Signup } from './features/auth';
import { Chat, EmptyChat } from './features/chat';
import { Contacts } from './features/contacts';
import { Maintenance } from './features/maintenance';
import { storage } from './utils/helpers';
import { STORAGE_KEYS, API_BASE_URL, API_ENDPOINTS } from './constants/config';
import useServerHealth from './hooks/useServerHealth';
import './styles/global.css';

function App() {
    const [user, setUser] = useState(null);
    const [activeView, setActiveView] = useState('loading'); // 'loading', 'empty', 'contacts', 'chat', 'recent_chats'
    const [selectedContact, setSelectedContact] = useState(null);
    const [isSignup, setIsSignup] = useState(false);
    const [hasChats, setHasChats] = useState(false);

    // Check server health
    const isServerUp = useServerHealth();

    useEffect(() => {
        const token = storage.get(STORAGE_KEYS.TOKEN);
        const storedUser = storage.get(STORAGE_KEYS.USERNAME);
        if (token && storedUser) {
            setUser(storedUser);
            checkRecentChats(storedUser);
        } else {
            setActiveView('empty');
        }
    }, []);

    const checkRecentChats = async (username) => {
        try {
            const token = storage.get(STORAGE_KEYS.TOKEN);
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.GET_CHAT_USERS(username)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    setHasChats(true);
                    setActiveView('recent_chats');
                } else {
                    setHasChats(false);
                    setActiveView('empty');
                }
            } else {
                setActiveView('empty');
            }
        } catch (error) {
            console.error("Failed to check recent chats", error);
            setActiveView('empty');
        }
    };

    const handleLogin = (username) => {
        setUser(username);
        checkRecentChats(username);
    };

    const handleLogout = () => {
        // 1. Clear all credentials from browser storage
        storage.clearAuth();

        // 2. Reset React State
        setUser(null);
        setSelectedContact(null);
        setActiveView('empty');
        setIsSignup(false);
        setHasChats(false);

        // 3. Force a page reload to ensure a clean slate
        window.location.reload();
    };

    const handleStartChat = () => {
        setActiveView('contacts');
    };

    const handleViewContacts = () => {
        setActiveView('contacts');
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setActiveView('chat');
    };

    const handleBackToDashboard = () => {
        if (hasChats) {
            setActiveView('recent_chats');
        } else {
            setActiveView('empty');
        }
        setSelectedContact(null);
    };

    const handleBackFromContacts = () => {
        if (hasChats) {
            setActiveView('recent_chats');
        } else {
            setActiveView('empty');
        }
    };

    return (
        <div className="App">
            {/* Automatic Maintenance Overlay */}
            {!isServerUp && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <Maintenance />
                </div>
            )}

            {user ? (
                <>
                    {activeView === 'empty' && (
                        <EmptyChat
                            onStartChat={handleStartChat}
                            onViewContacts={handleViewContacts}
                            onLogout={handleLogout}
                        />
                    )}
                    {activeView === 'recent_chats' && (
                        <Contacts
                            mode="recent"
                            onSelectContact={handleSelectContact}
                            onBack={null} // Back button hidden in recent mode anyway
                            onNewChat={() => setActiveView('contacts')}
                            onViewChats={() => { }} // Already on chats
                            onLogout={handleLogout}
                        />
                    )}
                    {activeView === 'contacts' && (
                        <Contacts
                            mode="all"
                            onSelectContact={handleSelectContact}
                            onBack={handleBackFromContacts}
                            onNewChat={() => { }} // Already on contacts
                            onViewChats={handleBackFromContacts}
                            onLogout={handleLogout}
                        />
                    )}
                    {activeView === 'chat' && selectedContact && (
                        <Chat
                            username={user}
                            selectedContact={selectedContact}
                            onBack={handleBackToDashboard}
                            onMessageSent={() => setHasChats(true)}
                            onLogout={handleLogout}
                        />
                    )}
                </>
            ) : (
                isSignup ? (
                    <Signup
                        onSignup={() => setIsSignup(false)} // After signup, switch to login (or auto-login if logic changes)
                        onSwitchToLogin={() => setIsSignup(false)}
                    />
                ) : (
                    <Login
                        onLogin={handleLogin}
                        onSwitchToSignup={() => setIsSignup(true)}
                    />
                )
            )}
        </div>
    );
}

export default App;

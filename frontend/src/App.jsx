import React, { useState, useEffect } from 'react';
import { Login, Signup } from './features/auth';
import { Chat, EmptyChat } from './features/chat';
import { Contacts, ContactBook, NewContactForm } from './features/contacts';
import { Settings } from './features/settings';
import { Maintenance } from './features/maintenance';
import { useAuth } from './context/AuthContext';
import { listConversations, getBot } from './services/chatService';
import useServerHealth from './hooks/useServerHealth';
import './styles/global.css';

function App() {
    const { user, status, logout } = useAuth();
    const [activeView, setActiveView] = useState('loading'); // 'loading' | 'empty' | 'recent_chats' | 'contacts' | 'add_contact' | 'settings' | 'chat'
    const [selectedPeer, setSelectedPeer] = useState(null); // { id, name }
    const [pendingPerson, setPendingPerson] = useState(null); // person being added (pre-save)
    const [isSignup, setIsSignup] = useState(false);
    const [hasChats, setHasChats] = useState(false);
    const [botId, setBotId] = useState(null); // Texter Bot's user id, resolved after auth
    const isServerUp = useServerHealth();

    // When authenticated, land on recent chats if any exist.
    useEffect(() => {
        if (status !== 'authenticated') return undefined;
        let cancelled = false;
        (async () => {
            try {
                const convs = await listConversations();
                if (cancelled) return;
                setHasChats(convs.length > 0);
                setActiveView(convs.length > 0 ? 'recent_chats' : 'empty');
            } catch {
                if (!cancelled) setActiveView('empty');
            }
        })();
        return () => { cancelled = true; };
    }, [status]);

    // Resolve the bot's id once so any chat with it (from anywhere) is flagged.
    useEffect(() => {
        if (status !== 'authenticated') { setBotId(null); return undefined; }
        let cancelled = false;
        (async () => {
            try {
                const bot = await getBot();
                if (!cancelled) setBotId(bot.id);
            } catch { /* bot is optional; ignore if unavailable */ }
        })();
        return () => { cancelled = true; };
    }, [status]);

    const handleLogout = () => {
        setSelectedPeer(null);
        setActiveView('loading');
        setIsSignup(false);
        setHasChats(false);
        setBotId(null);
        logout();
    };

    const handleSelectPeer = (peer) => {
        const isBot = peer.isBot || (botId != null && peer.id === botId);
        setSelectedPeer({ ...peer, isBot });
        setActiveView('chat');
    };

    // Open (or create) the chat with Texter Bot.
    const openBotChat = async () => {
        try {
            let id = botId;
            if (id == null) {
                const bot = await getBot();
                id = bot.id;
                setBotId(id);
            }
            setSelectedPeer({ id, name: 'Texter Bot', isBot: true });
            setActiveView('chat');
        } catch { /* bot unreachable; leave the current view */ }
    };

    // Opening a saved contact goes straight to the chat.
    const openContactChat = (c) => {
        handleSelectPeer({
            id: c.contact_id,
            name: c.nickname || `${c.first_name} ${c.last_name || ''}`.trim(),
        });
    };

    // Picking a searched person opens the New Contact modal (over the Find
    // People list) to set a nickname before saving.
    const handlePickPerson = (person) => {
        setPendingPerson(person);
    };

    const backToDashboard = () => {
        setSelectedPeer(null);
        setActiveView(hasChats ? 'recent_chats' : 'empty');
    };

    if (status === 'booting') {
        return <div className="App" />;
    }

    return (
        <div className="App">
            {/* Automatic Maintenance Overlay */}
            {!isServerUp && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <Maintenance />
                </div>
            )}

            {status === 'authenticated' && user ? (
                <>
                    {activeView === 'empty' && (
                        <EmptyChat
                            onStartChat={() => setActiveView('add_contact')}
                            onViewContacts={() => setActiveView('contacts')}
                            onOpenSettings={() => setActiveView('settings')}
                            onOpenBot={openBotChat}
                            onLogout={handleLogout}
                        />
                    )}
                    {activeView === 'recent_chats' && (
                        <Contacts
                            mode="recent"
                            onSelectContact={handleSelectPeer}
                            onBack={null}
                            onNewChat={() => setActiveView('contacts')}
                            onViewChats={() => { }}
                            onOpenSettings={() => setActiveView('settings')}
                            onOpenBot={openBotChat}
                            onLogout={handleLogout}
                        />
                    )}
                    {activeView === 'contacts' && (
                        <ContactBook
                            onOpenContact={openContactChat}
                            onAddContact={() => setActiveView('add_contact')}
                            onViewChats={backToDashboard}
                            onOpenSettings={() => setActiveView('settings')}
                        />
                    )}
                    {activeView === 'add_contact' && (
                        <>
                            <Contacts
                                mode="all"
                                onSelectContact={handlePickPerson}
                                onBack={() => setActiveView('contacts')}
                                onNewChat={() => { }}
                                onViewChats={backToDashboard}
                                onOpenSettings={() => setActiveView('settings')}
                                onLogout={handleLogout}
                            />
                            {pendingPerson && (
                                <NewContactForm
                                    person={pendingPerson}
                                    onBack={() => setPendingPerson(null)}
                                    onAdded={() => setPendingPerson(null)}
                                />
                            )}
                        </>
                    )}
                    {activeView === 'settings' && (
                        <Settings
                            onBack={backToDashboard}
                            onLogout={handleLogout}
                            onOpenChats={backToDashboard}
                            onOpenContacts={() => setActiveView('contacts')}
                        />
                    )}
                    {activeView === 'chat' && selectedPeer && (
                        <Chat
                            peer={selectedPeer}
                            onBack={backToDashboard}
                            onMessageSent={() => setHasChats(true)}
                            onLogout={handleLogout}
                        />
                    )}
                </>
            ) : (
                isSignup ? (
                    <Signup onSwitchToLogin={() => setIsSignup(false)} />
                ) : (
                    <Login onSwitchToSignup={() => setIsSignup(true)} />
                )
            )}
        </div>
    );
}

export default App;

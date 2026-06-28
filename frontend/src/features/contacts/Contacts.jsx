import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, MessageCircle, ArrowLeft, LogOut, Settings, Bot } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import { listConversations, searchUsers } from '../../services/chatService';
import { displayName, formatTime } from '../../utils/helpers';
import './Contacts.css';

const Contacts = ({ onSelectContact, onBack, onLogout, onNewChat, onViewChats, onOpenSettings, onOpenBot, mode = 'all' }) => {
    const [items, setItems] = useState([]); // [{ id, name, subtitle }]
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(mode === 'recent');
    const [error, setError] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            setError(null);
            const convs = await listConversations();
            setItems(convs.map((c) => ({
                id: c.peer_id,
                name: c.peer_name,
                subtitle: c.last_message_at ? `Last active ${formatTime(c.last_message_at)}` : '',
            })));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'recent') loadConversations();
    }, [mode]);

    const runSearch = async (q) => {
        try {
            setLoading(true);
            const users = await searchUsers(q);
            setItems(users.map((u) => ({ id: u.id, name: displayName(u), subtitle: u.email })));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // all mode: debounced server-side search
    useEffect(() => {
        if (mode !== 'all') return undefined;
        const q = searchQuery.trim();
        if (!q) {
            setItems([]);
            setError(null);
            setLoading(false);
            return undefined;
        }
        setLoading(true);
        const timer = setTimeout(() => runSearch(q), 300);
        return () => clearTimeout(timer);
    }, [mode, searchQuery]);

    const visibleItems = mode === 'recent'
        ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : items;

    // Pin a Texter Bot entry at the top of the recent-chats list (respects search).
    const showBot = mode === 'recent' && !!onOpenBot
        && 'texter bot'.includes(searchQuery.trim().toLowerCase());

    return (
        <div className="contacts-container">
            {/* Header */}
            <header className="contacts-header">
                <div className="header-left">
                    {mode !== 'recent' && (
                        <button className="back-button" onClick={onBack}>
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h1>{mode === 'recent' ? 'Chats' : 'Find People'}</h1>
                </div>

                <div className="header-right">
                    <div className="settings-container" ref={settingsRef}>
                        <button
                            type="button"
                            className={`settings-button ${isSettingsOpen ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsSettingsOpen(!isSettingsOpen);
                            }}
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>

                        {isSettingsOpen && (
                            <div className="settings-menu">
                                <button
                                    type="button"
                                    className="menu-item logout"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLogout();
                                    }}
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Search Bar */}
            <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder={mode === 'all' ? 'Search people by name or email...' : 'Search chats...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Contacts List */}
            <div className="contacts-list" style={{ paddingBottom: '80px' }}>
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>{mode === 'recent' ? 'Loading chats...' : 'Searching...'}</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <p className="error-message">{error}</p>
                        <button
                            className="retry-button"
                            onClick={() => (mode === 'recent' ? loadConversations() : runSearch(searchQuery.trim()))}
                        >
                            Retry
                        </button>
                    </div>
                ) : (!showBot && visibleItems.length === 0) ? (
                    <div className="empty-state">
                        <Users size={48} className="empty-icon" />
                        <p className="empty-message">
                            {mode === 'all'
                                ? (searchQuery.trim() ? 'No people found' : 'Type a name or email to find people')
                                : (searchQuery ? 'No chats found' : 'No chats yet')}
                        </p>
                    </div>
                ) : (
                    <>
                        {showBot && (
                            <div
                                className="contact-item bot-contact-item"
                                onClick={onOpenBot}
                            >
                                <div className="contact-avatar">
                                    <div className="bot-avatar"><Bot size={24} /></div>
                                </div>
                                <div className="contact-info">
                                    <h3 className="contact-name">Texter Bot</h3>
                                    <p className="contact-status">AI assistant • always here</p>
                                </div>
                                <button className="message-button">
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        )}
                        {visibleItems.map((item) => (
                            <div
                                key={item.id}
                                className="contact-item"
                                onClick={() => onSelectContact({ id: item.id, name: item.name })}
                            >
                                <div className="contact-avatar">
                                    <img
                                        src={`https://i.pravatar.cc/150?u=${item.id}`}
                                        alt={item.name}
                                    />
                                    <div className="status-indicator"></div>
                                </div>
                                <div className="contact-info">
                                    <h3 className="contact-name">{item.name}</h3>
                                    <p className="contact-status">{item.subtitle || 'Available'}</p>
                                </div>
                                <button className="message-button">
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Bottom Nav Footer */}
            <BottomNav
                activeTab={mode === 'recent' ? 'chats' : 'contacts'}
                onChatsClick={() => mode !== 'recent' && onViewChats && onViewChats()}
                onContactsClick={() => mode === 'recent' && onNewChat && onNewChat()}
                onSettingsClick={onOpenSettings}
            />
        </div>
    );
};

export default Contacts;

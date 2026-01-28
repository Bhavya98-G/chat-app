import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, MessageCircle, ArrowLeft, LogOut, Settings } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../../constants/config';
import BottomNav from '../../components/BottomNav';
import './Contacts.css';

const Contacts = ({ onSelectContact, onBack, onLogout, onNewChat, onViewChats, mode = 'all' }) => {
    // ... (state hooks remain same)
    const [contacts, setContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    // ... (rest of logic unchanged)

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

    useEffect(() => {
        fetchContacts();
    }, [mode]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const currentUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);

            const endpoint = mode === 'recent'
                ? API_ENDPOINTS.USERS.GET_CHAT_USERS(currentUsername)
                : API_ENDPOINTS.USERS.GET_ALL(currentUsername);

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contacts');
            }

            const data = await response.json();
            setContacts(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);

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
                    <h1>{mode === 'recent' ? 'Chats' : 'Contacts'}</h1>
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
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Contacts List */}
            <div className="contacts-list" style={{ paddingBottom: '80px' }}>
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading contacts...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <p className="error-message">{error}</p>
                        <button className="retry-button" onClick={fetchContacts}>
                            Retry
                        </button>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} className="empty-icon" />
                        <p className="empty-message">
                            {searchQuery ? 'No contacts found' : 'No contacts available'}
                        </p>
                    </div>
                ) : (
                    filteredContacts.map((contact) => (
                        <div
                            key={contact.id}
                            className={`contact-item ${contact.username === currentUsername ? 'current-user' : ''}`}
                            onClick={() => contact.username !== currentUsername && onSelectContact(contact)}
                        >
                            <div className="contact-avatar">
                                <img
                                    src={`https://i.pravatar.cc/150?u=${contact.username}`}
                                    alt={contact.username}
                                />
                                <div className="status-indicator"></div>
                            </div>
                            <div className="contact-info">
                                <h3 className="contact-name">
                                    {contact.username}
                                    {contact.username === currentUsername && (
                                        <span className="you-badge">You</span>
                                    )}
                                </h3>
                                <p className="contact-status">
                                    {contact.username === currentUsername ? 'Your account' : 'Available'}
                                </p>
                            </div>
                            {contact.username !== currentUsername && (
                                <button className="message-button">
                                    <MessageCircle size={20} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Nav Footer */}
            <BottomNav
                activeTab={mode === 'recent' ? 'chats' : 'contacts'}
                onChatsClick={() => mode !== 'recent' && onViewChats && onViewChats()}
                onContactsClick={() => mode === 'recent' && onNewChat && onNewChat()}
                onSettingsClick={() => { }}
            />
        </div>
    );
};

export default Contacts;

import React, { useState, useRef, useEffect } from 'react';
import { Settings, MessageCircle, LogOut } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import './EmptyChat.css';

const EmptyChat = ({ onStartChat, onViewContacts, onLogout }) => {
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

    return (
        <div className="empty-chat-container">
            <header className="empty-header">
                <h1>Messages</h1>
                <div style={{ position: 'relative' }} ref={settingsRef}>
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
                        <Settings size={28} />
                    </button>
                    {isSettingsOpen && (
                        <div className="settings-menu" style={{ top: '100%', right: '0' }}>
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
            </header>

            <div className="empty-content">
                {/* CSS Art for the 3D Illustration */}
                <div className="artwork-container">
                    <div className="bubble bubble-1"></div>
                    <div className="bubble bubble-2"></div>
                    <div className="bubble bubble-3"></div>
                    <div className="bubble bubble-main"></div>
                </div>

                <h2 className="empty-title">No conversations yet</h2>
                <p className="empty-subtitle">
                    Start a new chat to connect with your friends!
                </p>

                <button className="start-chat-btn" onClick={onStartChat}>
                    <MessageCircle size={24} fill="white" />
                    Start Chatting
                </button>
            </div>

            <BottomNav
                activeTab="chats"
                onChatsClick={() => { }}
                onContactsClick={onViewContacts}
                onSettingsClick={() => { }}
            />
        </div>
    );
};

export default EmptyChat;

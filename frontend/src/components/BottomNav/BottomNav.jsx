import React from 'react';
import { MessageSquare, Users, Settings } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ activeTab, onChatsClick, onContactsClick, onSettingsClick }) => {
    return (
        <nav className="bottom-nav">
            <button
                className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
                onClick={onChatsClick}
            >
                <MessageSquare size={22} />
                Chats
            </button>
            <button
                className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
                onClick={onContactsClick}
            >
                <Users size={22} />
                Contacts
            </button>
            <button
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={onSettingsClick}
            >
                <Settings size={22} />
                Settings
            </button>
        </nav>
    );
};

export default BottomNav;

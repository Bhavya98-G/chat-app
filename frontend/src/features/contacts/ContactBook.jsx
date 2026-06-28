import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Settings, Ban } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import { listContacts } from '../../services/contactService';
import './Contacts.css';

const fullName = (c) => `${c.first_name} ${c.last_name || ''}`.trim();

const ContactBook = ({ onOpenContact, onAddContact, onViewChats, onOpenSettings }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await listContacts();
                if (!cancelled) setItems(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [reloadKey]);

    const q = filter.trim().toLowerCase();
    const visible = !q ? items : items.filter((c) => (
        fullName(c).toLowerCase().includes(q) || (c.nickname || '').toLowerCase().includes(q)
    ));

    return (
        <div className="contacts-container">
            <header className="contacts-header">
                <div className="header-left">
                    <h1>Contacts</h1>
                </div>
                <div className="header-right" style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="settings-button" onClick={onAddContact} title="Add contact">
                        <UserPlus size={20} />
                    </button>
                    <button type="button" className="settings-button" onClick={onOpenSettings} title="Settings">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Filter contacts..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="contacts-list" style={{ paddingBottom: '80px' }}>
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading contacts...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <p className="error-message">{error}</p>
                        <button className="retry-button" onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="empty-state">
                        <UserPlus size={48} className="empty-icon" />
                        <p className="empty-message">
                            {filter.trim() ? 'No matching contacts' : 'No contacts yet. Tap + to add someone.'}
                        </p>
                    </div>
                ) : (
                    visible.map((c) => (
                        <div key={c.contact_id} className="contact-item" onClick={() => onOpenContact(c)}>
                            <div className="contact-avatar">
                                <img src={`https://i.pravatar.cc/150?u=${c.contact_id}`} alt={fullName(c)} />
                            </div>
                            <div className="contact-info">
                                <h3 className="contact-name">{c.nickname || fullName(c)}</h3>
                                <p className="contact-status">{c.is_blocked ? 'Blocked' : fullName(c)}</p>
                            </div>
                            {c.is_blocked && <Ban size={18} style={{ color: '#ef4444' }} />}
                        </div>
                    ))
                )}
            </div>

            <BottomNav
                activeTab="contacts"
                onChatsClick={onViewChats}
                onContactsClick={() => { }}
                onSettingsClick={onOpenSettings}
            />
        </div>
    );
};

export default ContactBook;

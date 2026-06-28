import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, Plus, Power,
    User, Lock, Palette, LogOut, HelpCircle, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/BottomNav';
import EditProfile from './EditProfile';
import ResetPassword from './ResetPassword';
import './Settings.css';

const Settings = ({ onBack, onLogout, onOpenChats, onOpenContacts }) => {
    const { user } = useAuth();
    const [view, setView] = useState('menu'); // 'menu' | 'edit_profile' | 'reset_password'

    if (view === 'edit_profile') {
        return <EditProfile onBack={() => setView('menu')} />;
    }
    if (view === 'reset_password') {
        return <ResetPassword onBack={() => setView('menu')} />;
    }

    const fullName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'You';
    const avatarId = user?.id ?? 'me';

    // Settings rows. Add an entry to surface another option — the list renders
    // itself. `accent` highlights the icon; items without a real action yet are
    // placeholders ready to wire up.
    const menu = [
        { key: 'edit_profile', icon: User, label: 'Edit Profile', accent: true, action: () => setView('edit_profile') },
        { key: 'reset_password', icon: Lock, label: 'Reset Password', action: () => setView('reset_password') },
        { key: 'appearance', icon: Palette, label: 'Appearance', action: () => {} },
    ];

    return (
        <div className="settings-screen">
            <header className="settings-header">
                <div className="settings-bar-inner">
                    <button className="back-button" onClick={onBack} aria-label="Back"><ArrowLeft size={24} /></button>
                    <h2>Settings</h2>
                </div>
            </header>

            <div className="settings-body">
              <div className="settings-content">
                {/* Profile preview */}
                <div className="settings-profile">
                    <button className="settings-avatar" onClick={() => setView('edit_profile')} aria-label="Edit profile">
                        <img src={`https://i.pravatar.cc/150?u=${avatarId}`} alt={fullName} />
                        <span className="settings-avatar-add"><Plus size={14} /></span>
                    </button>
                    <h3 className="settings-profile-name">{fullName}</h3>
                    {user?.email && <p className="settings-profile-email">{user.email}</p>}
                </div>

                {/* Options */}
                <div className="settings-options">
                    {menu.map(({ key, icon: Icon, label, accent, action }) => (
                        <button key={key} type="button" className="settings-card" onClick={action}>
                            <span className="settings-card-left">
                                <span className={`settings-card-icon${accent ? ' accent' : ''}`}><Icon size={20} /></span>
                                <span className="settings-card-label">{label}</span>
                            </span>
                            <ChevronRight size={20} className="settings-card-chevron" />
                        </button>
                    ))}

                    <div className="settings-divider" />

                    <button type="button" className="settings-card danger" onClick={onLogout}>
                        <span className="settings-card-left">
                            <span className="settings-card-icon danger"><LogOut size={20} /></span>
                            <span className="settings-card-label">Logout</span>
                        </span>
                        <Power size={20} className="settings-card-power" />
                    </button>
                </div>

                {/* Support */}
                <div className="settings-support">
                    <button type="button" className="settings-support-card help">
                        <div className="settings-support-top">
                            <HelpCircle size={22} />
                            <h3>Help Center</h3>
                        </div>
                        <p>Guides &amp; FAQs</p>
                    </button>
                    <button type="button" className="settings-support-card">
                        <div className="settings-support-top">
                            <Shield size={22} />
                            <h3>Privacy</h3>
                        </div>
                        <p>Manage data</p>
                    </button>
                </div>
              </div>
            </div>

            {/* Bottom navigation — shared component, consistent with Chat/Contacts */}
            <BottomNav
                activeTab="settings"
                onChatsClick={onOpenChats}
                onContactsClick={onOpenContacts}
                onSettingsClick={() => {}}
            />
        </div>
    );
};

export default Settings;

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { fetchMe } from '../../services/authService';
import { setBio, clearBio, setPhone, clearPhone } from '../../services/profileService';
import './Settings.css';

// The profile editor (bio + phone). Reached from the Settings menu.
const EditProfile = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [bio, setBioInput] = useState('');
    const [phone, setPhoneInput] = useState('');
    const [hadBio, setHadBio] = useState(false);
    const [hadPhone, setHadPhone] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'ok' | 'err', text }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const me = await fetchMe();
                if (cancelled) return;
                setBioInput(me.bio || '');
                setPhoneInput(me.phone_number || '');
                setHadBio(!!me.bio);
                setHadPhone(!!me.phone_number);
            } catch (err) {
                if (!cancelled) setMessage({ type: 'err', text: err.message });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const run = async (fn, okText) => {
        try {
            setBusy(true);
            setMessage(null);
            await fn();
            setMessage({ type: 'ok', text: okText });
        } catch (err) {
            setMessage({ type: 'err', text: err.message });
        } finally {
            setBusy(false);
        }
    };

    const saveBio = () => run(async () => {
        await setBio(bio.trim(), hadBio);
        setHadBio(true);
    }, 'Bio saved');

    const removeBio = () => run(async () => {
        await clearBio();
        setBioInput('');
        setHadBio(false);
    }, 'Bio cleared');

    const savePhone = () => run(async () => {
        await setPhone(phone.trim(), hadPhone);
        setHadPhone(true);
    }, 'Phone saved');

    const removePhone = () => run(async () => {
        await clearPhone();
        setPhoneInput('');
        setHadPhone(false);
    }, 'Phone cleared');

    return (
        <div className="settings-screen">
            <header className="settings-header">
                <div className="settings-bar-inner">
                    <button className="back-button" onClick={onBack}><ArrowLeft size={24} /></button>
                    <h2>Edit Profile</h2>
                </div>
            </header>

            <div className="settings-body">
              <div className="settings-content">
                {loading ? (
                    <div className="spinner"></div>
                ) : (
                    <>
                        {message && (
                            <div className={`settings-message ${message.type}`}>{message.text}</div>
                        )}

                        <section className="settings-section">
                            <label className="settings-label">Bio</label>
                            <textarea
                                className="settings-textarea"
                                rows={3}
                                value={bio}
                                placeholder="Tell people about yourself..."
                                onChange={(e) => setBioInput(e.target.value)}
                            />
                            <div className="settings-row-actions">
                                <button className="settings-btn primary" onClick={saveBio} disabled={busy || !bio.trim()}>
                                    <Save size={16} /> Save
                                </button>
                                {hadBio && (
                                    <button className="settings-btn" onClick={removeBio} disabled={busy}>
                                        <Trash2 size={16} /> Clear
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className="settings-section">
                            <label className="settings-label">Phone number</label>
                            <input
                                className="settings-input"
                                value={phone}
                                placeholder="+14155552671"
                                onChange={(e) => setPhoneInput(e.target.value)}
                            />
                            <div className="settings-row-actions">
                                <button className="settings-btn primary" onClick={savePhone} disabled={busy || !phone.trim()}>
                                    <Save size={16} /> Save
                                </button>
                                {hadPhone && (
                                    <button className="settings-btn" onClick={removePhone} disabled={busy}>
                                        <Trash2 size={16} /> Clear
                                    </button>
                                )}
                            </div>
                            <p className="settings-hint">Use international format, e.g. +14155552671.</p>
                        </section>
                    </>
                )}
              </div>
            </div>
        </div>
    );
};

export default EditProfile;

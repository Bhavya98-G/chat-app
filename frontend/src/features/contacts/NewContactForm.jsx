import React, { useState } from 'react';
import { X, Pencil, UserPlus } from 'lucide-react';
import { createContact } from '../../services/contactService';
import './NewContactForm.css';

// Shown after a person is picked from search: set a nickname, then save.
const NewContactForm = ({ person, onBack, onAdded }) => {
    const [nickname, setNickname] = useState(person.name || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const handleAdd = async () => {
        const nick = nickname.trim() || person.name;
        try {
            setBusy(true);
            setError(null);
            await createContact(person.id, nick);
        } catch (err) {
            if (err.status !== 409) { // 409 = already a contact; treat as done
                setError(err.message);
                setBusy(false);
                return;
            }
        }
        onAdded({
            contact_id: person.id,
            nickname: nick,
            first_name: person.name,
            last_name: '',
            is_blocked: false,
        });
    };

    return (
        <div className="newcontact-overlay" onClick={onBack}>
            <div className="newcontact-modal" onClick={(e) => e.stopPropagation()}>
            <header className="newcontact-header">
                <h1>New Contact</h1>
                <button className="newcontact-close" onClick={onBack} aria-label="Close">
                    <X size={22} />
                </button>
            </header>

            <main className="newcontact-main">
                <div className="newcontact-avatar">
                    <img src={`https://i.pravatar.cc/150?u=${person.id}`} alt={person.name} />
                </div>

                <div className="newcontact-field">
                    <label htmlFor="nickname">Nickname</label>
                    <div className="newcontact-input-wrap">
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter contact nickname"
                            autoFocus
                        />
                        <Pencil size={18} className="newcontact-input-icon" />
                    </div>
                </div>

                {error && <p className="newcontact-error">{error}</p>}

                <button
                    className="newcontact-add"
                    onClick={handleAdd}
                    disabled={busy || !nickname.trim()}
                >
                    <UserPlus size={22} />
                    {busy ? 'Adding...' : 'Add Contact'}
                </button>
            </main>
            </div>
        </div>
    );
};

export default NewContactForm;

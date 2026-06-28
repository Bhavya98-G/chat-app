import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowLeft,
    Video,
    Phone,
    Plus,
    Smile,
    Send,
    Check,
    CheckCheck,
    ArrowDown,
    MoreVertical,
    Edit2,
    Ban,
    Trash2,
    Mail,
    Calendar,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocketStatus, useSocketEvent } from '../../hooks/useChatSocket';
import socket from '../../services/socketService';
import { openConversation, getMessages } from '../../services/chatService';
import { getContact, changeNickname, setBlocked, deleteContact } from '../../services/contactService';
import { formatTime } from '../../utils/helpers';
import './Chat.css';

const toUiMessage = (m) => ({
    id: m.id,
    senderId: m.sender_id,
    content: m.content,
    time: formatTime(m.created_at),
    status: 'sent',
});

const Chat = ({ peer, onBack, onLogout, onMessageSent }) => {
    const { user } = useAuth();
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]); // [{ id, senderId, content, time, status }]
    const [input, setInput] = useState('');
    const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [error, setError] = useState(null);
    const [banner, setBanner] = useState(null); // transient socket-error banner
    const [reloadKey, setReloadKey] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false); // unknown until a presence frame arrives
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [contactName, setContactName] = useState(peer.name);
    const [contactInfo, setContactInfo] = useState(null); // { email, phone_number, bio, created_at, is_blocked, nickname }
    const [menuOpen, setMenuOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [actionBusy, setActionBusy] = useState(false);
    const socketStatus = useSocketStatus();
    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const menuRef = useRef(null);
    const blocked = !!contactInfo?.is_blocked;
    const isBot = !!peer.isBot;

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        setShowScrollButton(false);
        setHasNewMessage(false);
    };

    // Handle scroll detection
    const handleScroll = () => {
        if (!messageListRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        setShowScrollButton(!isNearBottom);
        if (isNearBottom) {
            setHasNewMessage(false);
        }
    };

    useEffect(() => {
        const messageList = messageListRef.current;
        if (messageList) {
            messageList.addEventListener('scroll', handleScroll);
            return () => messageList.removeEventListener('scroll', handleScroll);
        }
    }, [phase]);

    useEffect(() => {
        // Check if user is at bottom before new message
        if (messageListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isAtBottom) {
                scrollToBottom();
            } else {
                setHasNewMessage(true);
            }
        }
    }, [messages]);

    // Open (or create) the conversation, load history, mark read.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setPhase('loading');
                setError(null);
                const convId = await openConversation(peer.id);
                const history = await getMessages(convId);
                if (cancelled) return;
                setConversationId(convId);
                setMessages(history.map(toUiMessage));
                setPhase('ready');
                socket.sendRead(convId);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                    setPhase('error');
                }
            }
        })();
        return () => { cancelled = true; };
    }, [peer.id, reloadKey]);

    // Load the contact's profile + blocked state for the header menu.
    useEffect(() => {
        setContactName(peer.name);
        setMenuOpen(false);
        setShowProfile(false);
        // The bot isn't a saved contact — skip the contact lookup entirely.
        if (peer.isBot) {
            setContactInfo(null);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            try {
                const info = await getContact(peer.id);
                if (!cancelled) setContactInfo(info);
            } catch {
                if (!cancelled) setContactInfo(null);
            }
        })();
        return () => { cancelled = true; };
    }, [peer.id, peer.name]);

    // Close the header menu on outside click.
    useEffect(() => {
        if (!menuOpen) return undefined;
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [menuOpen]);

    // ---- contact actions (header menu) ----
    const handleRename = async () => {
        setMenuOpen(false);
        const next = window.prompt('Nickname', contactName);
        if (next === null) return;
        const trimmed = next.trim();
        if (!trimmed) return;
        try {
            setActionBusy(true);
            await changeNickname(peer.id, trimmed);
            setContactName(trimmed);
            setContactInfo((p) => (p ? { ...p, nickname: trimmed } : p));
        } catch (err) {
            setBanner(err.message);
        } finally {
            setActionBusy(false);
        }
    };

    const handleBlockToggle = async () => {
        setMenuOpen(false);
        try {
            setActionBusy(true);
            await setBlocked(peer.id, !blocked);
            setContactInfo((p) => (p ? { ...p, is_blocked: !blocked } : p));
        } catch (err) {
            setBanner(err.message);
        } finally {
            setActionBusy(false);
        }
    };

    const handleRemove = async () => {
        setMenuOpen(false);
        if (!window.confirm(`Remove ${contactName} from contacts?`)) return;
        try {
            setActionBusy(true);
            await deleteContact(peer.id);
            onBack();
        } catch (err) {
            setBanner(err.message);
            setActionBusy(false);
        }
    };

    // ---- socket frames ----
    const handleMessage = useCallback((frame) => {
        if (frame.conversation_id !== conversationId) return;
        setMessages((prev) => [...prev, {
            id: frame.id,
            senderId: frame.sender_id,
            content: frame.content,
            time: formatTime(frame.created_at),
            status: 'sent',
        }]);
        if (frame.sender_id !== user.id) socket.sendRead(conversationId);
    }, [conversationId, user.id]);
    useSocketEvent('message', handleMessage);

    const handleTyping = useCallback((frame) => {
        if (frame.conversation_id === conversationId && frame.user_id === peer.id) {
            setIsTyping(frame.is_typing);
        }
    }, [conversationId, peer.id]);
    useSocketEvent('typing', handleTyping);

    const handleRead = useCallback((frame) => {
        if (frame.conversation_id === conversationId && frame.user_id === peer.id) {
            setMessages((prev) => prev.map((m) => (
                m.senderId === user.id ? { ...m, status: 'read' } : m
            )));
        }
    }, [conversationId, peer.id, user.id]);
    useSocketEvent('read', handleRead);

    const handlePresence = useCallback((frame) => {
        if (frame.user_id === peer.id) setIsOnline(frame.status === 'online');
    }, [peer.id]);
    useSocketEvent('presence', handlePresence);

    const handleErrorFrame = useCallback((frame) => {
        setBanner(frame.detail || 'Something went wrong');
    }, []);
    useSocketEvent('error', handleErrorFrame);

    // transient banner auto-clears
    useEffect(() => {
        if (!banner) return undefined;
        const t = setTimeout(() => setBanner(null), 4000);
        return () => clearTimeout(t);
    }, [banner]);

    // ---- input / send ----
    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (!conversationId) return;

        socket.sendTyping(conversationId, e.target.value.length > 0);

        clearTimeout(typingTimeoutRef.current);
        if (e.target.value.length > 0) {
            // Stop typing indicator after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socket.sendTyping(conversationId, false);
            }, 2000);
        }
    };

    const sendMessage = () => {
        const text = input.trim();
        if (!text || !conversationId) return;

        clearTimeout(typingTimeoutRef.current);
        socket.sendTyping(conversationId, false);

        const sent = socket.sendMessage(conversationId, text);
        if (!sent) {
            setBanner('Not connected — message not sent');
            return;
        }
        setInput('');
        onMessageSent?.();
        // No optimistic insert: the server echo (with DB id + timestamp) renders it.
    };

    if (!peer) {
        return <div className="chat-container">No contact selected</div>;
    }

    return (
        <div className="chat-container">
            {/* Reconnection / error toast */}
            {socketStatus === 'reconnecting' && (
                <div className="connection-toast">
                    Reconnecting...
                </div>
            )}
            {banner && (
                <div className="connection-toast">
                    {banner}
                </div>
            )}

            {/* Header */}
            <header className="chat-header">
                <div className="header-left">
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="user-info">
                        <div className="avatar">
                            <img
                                src={`https://i.pravatar.cc/150?u=${peer.id}`}
                                alt={contactName}
                            />
                            <div className={`status-dot ${(isBot || isOnline) ? 'online' : 'offline'}`}></div>
                        </div>
                        <div className="user-details">
                            <h3>{contactName}</h3>
                            <p className={`user-status ${isTyping ? 'typing' : ''}`}>
                                {isBot ? 'AI assistant' : isTyping ? (
                                    <span className="typing-indicator-text">
                                        <span className="typing-dots">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </span>
                                    </span>
                                ) : (isOnline ? 'Online' : 'Offline')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="icon-button"><Video size={24} /></button>
                    <button className="icon-button"><Phone size={24} /></button>
                    {/* Contact management is meaningless for the bot — hide it. */}
                    {!isBot && (
                        <div className="header-menu" ref={menuRef}>
                            <button
                                className="icon-button"
                                onClick={() => setMenuOpen((o) => !o)}
                                title="More"
                            >
                                <MoreVertical size={24} />
                            </button>
                            {menuOpen && (
                                <div className="header-dropdown">
                                    <button onClick={() => { setMenuOpen(false); setShowProfile(true); }}>
                                        <Mail size={18} /> View profile
                                    </button>
                                    <button onClick={handleRename} disabled={actionBusy}>
                                        <Edit2 size={18} /> Rename
                                    </button>
                                    <button onClick={handleBlockToggle} disabled={actionBusy}>
                                        <Ban size={18} /> {blocked ? 'Unblock' : 'Block'}
                                    </button>
                                    <button className="danger" onClick={handleRemove} disabled={actionBusy}>
                                        <Trash2 size={18} /> Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Profile modal */}
            {showProfile && (
                <div className="profile-overlay" onClick={() => setShowProfile(false)}>
                    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                        <header className="profile-modal-header">
                            <h3>Profile</h3>
                            <button className="icon-button" onClick={() => setShowProfile(false)} aria-label="Close">
                                <X size={20} />
                            </button>
                        </header>
                        <div className="profile-avatar">
                            <img src={`https://i.pravatar.cc/150?u=${peer.id}`} alt={contactName} />
                        </div>
                        <h2 className="profile-name">{contactName}</h2>
                        {contactInfo ? (
                            <div className="profile-fields">
                                {contactInfo.bio && <p className="profile-bio">{contactInfo.bio}</p>}
                                <div className="profile-field"><Mail size={16} /> <span>{contactInfo.email}</span></div>
                                {contactInfo.phone_number && (
                                    <div className="profile-field"><Phone size={16} /> <span>{contactInfo.phone_number}</span></div>
                                )}
                                {contactInfo.created_at && (
                                    <div className="profile-field">
                                        <Calendar size={16} /> <span>Member since {new Date(contactInfo.created_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {blocked && <span className="profile-blocked-tag">Blocked</span>}
                            </div>
                        ) : (
                            <p className="profile-loading">Loading…</p>
                        )}
                    </div>
                </div>
            )}

            {/* Message List */}
            <div className="message-list" ref={messageListRef}>
                {phase === 'loading' ? (
                    <div className="loading-messages">
                        <div className="spinner"></div>
                        <p>Loading messages...</p>
                    </div>
                ) : phase === 'error' ? (
                    <div className="no-messages" style={{ flexDirection: 'column', gap: '10px' }}>
                        <p style={{ color: '#ef4444' }}>{error}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setReloadKey((k) => k + 1)}
                                className="send-button"
                                style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
                            >
                                Retry
                            </button>
                            <button
                                onClick={onLogout}
                                className="send-button"
                                style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 ? (
                            <div className="no-messages">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const type = msg.senderId === user.id ? 'outgoing' : 'incoming';
                                return (
                                    <div key={msg.id} className={`message-group ${type}`}>
                                        {type === 'incoming' && (
                                            <div className="message-avatar">
                                                <img
                                                    src={`https://i.pravatar.cc/150?u=${peer.id}`}
                                                    alt="Sender"
                                                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                                />
                                            </div>
                                        )}

                                        <div className="message-content">
                                            <div className="message-bubble">
                                                {msg.content}
                                            </div>
                                            <div className="message-meta">
                                                <span>{msg.time}</span>
                                                {type === 'outgoing' && (
                                                    msg.status === 'read' ? (
                                                        <CheckCheck size={14} className="read-receipt delivered" />
                                                    ) : (
                                                        <Check size={14} className="read-receipt sent" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button
                    className={`scroll-to-bottom ${hasNewMessage ? 'has-new-message' : ''}`}
                    onClick={() => scrollToBottom(true)}
                    title="Scroll to bottom"
                >
                    <ArrowDown size={20} />
                    {hasNewMessage && <span className="new-message-badge">New</span>}
                </button>
            )}

            {/* Input Area */}
            <div className="chat-input-area">
                <button className="plus-button">
                    <Plus size={24} />
                </button>

                <div className="input-wrapper">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="smile-button">
                        <Smile size={24} />
                    </button>
                </div>

                <button className="send-button" onClick={sendMessage}>
                    <Send size={24} fill="white" />
                </button>
            </div>
        </div>
    );
};

export default Chat;

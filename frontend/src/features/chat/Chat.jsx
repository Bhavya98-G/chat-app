import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft,
    Video,
    Phone,
    Plus,
    Smile,
    Send,
    Check,
    CheckCheck,
    ArrowDown
} from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../../constants/config';
import './Chat.css';

const Chat = ({ username, selectedContact, onBack, onLogout, onMessageSent }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [initializing, setInitializing] = useState(true); // New state for user lookup
    const [loadingMessages, setLoadingMessages] = useState(false); // Renamed for clarity
    const [error, setError] = useState(null); // New state for errors
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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
    }, []);

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

    // Fetch current user ID
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                setInitializing(true);
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                if (!token) {
                    setError("No authentication token found");
                    return;
                }
                // Pass a dummy username to get ALL users including current one to find ID
                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.GET_ALL('__lookup__')}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch users: ${response.status}`);
                }

                const users = await response.json();
                const currentUser = users.find(u => u.username === username);
                if (currentUser) {
                    setCurrentUserId(currentUser.id);
                    setError(null);
                } else {
                    console.error("Current user not found in user list");
                    setError("Could not verify user identity.");
                }
            } catch (error) {
                console.error('Error fetching current user:', error);
                setError("Failed to load user data. Please try again.");
            } finally {
                setInitializing(false);
            }
        };

        if (username) {
            fetchCurrentUser();
        } else {
            console.error("No username provided to Chat component");
            setInitializing(false);
        }
    }, [username]);

    // Fetch chat history when contact is selected
    useEffect(() => {
        if (!currentUserId || !selectedContact) return;

        const fetchHistory = async () => {
            try {
                setLoadingMessages(true);
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                const response = await fetch(
                    `${API_BASE_URL}${API_ENDPOINTS.MESSAGES.GET_HISTORY(currentUserId, selectedContact.id)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const formattedMessages = data.map(m => ({
                        sender: m.sender_id === currentUserId ? 'Me' : selectedContact.username,
                        message: m.content,
                        time: new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        type: m.sender_id === currentUserId ? 'outgoing' : 'incoming'
                    }));
                    setMessages(formattedMessages);
                } else {
                    console.error("Failed to fetch messages");
                }
            } catch (error) {
                console.error('Error fetching chat history:', error);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchHistory();
    }, [currentUserId, selectedContact]);

    // WebSocket connection with auto-reconnect
    useEffect(() => {
        if (!currentUserId) return;

        let reconnectTimeout;

        const connectWS = () => {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const socketUrl = API_ENDPOINTS.WEBSOCKET.CONNECT(token);
            ws.current = new WebSocket(socketUrl);

            ws.current.onopen = () => {
                console.log('Connected to WebSocket');
                setIsReconnecting(false);
            };

            ws.current.onmessage = (event) => {
                const message = JSON.parse(event.data);

                // Handle presence status
                if (message.type === 'presence' && message.user_id === selectedContact.id) {
                    setIsOnline(message.status === 'online');
                    return;
                }

                // Handle typing status
                if (message.type === 'typing' && message.sender_id === selectedContact.id) {
                    setIsTyping(message.is_typing);
                    return;
                }

                // Only add message if it's from the current contact
                if (message.sender_id === selectedContact.id || message.receiver_id === selectedContact.id) {
                    setMessages((prev) => [...prev, {
                        sender: message.sender_id === currentUserId ? 'Me' : selectedContact.username,
                        message: message.message || message.content,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: message.sender_id === currentUserId ? 'outgoing' : 'incoming',
                        status: message.sender_id === currentUserId ? 'sent' : null
                    }]);
                }
            };

            ws.current.onclose = () => {
                console.log("WS Closed. Retrying in 3 seconds...");
                setIsReconnecting(true);
                reconnectTimeout = setTimeout(connectWS, 3000);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                ws.current.close(); // Ensure close is triggered
            };
        };

        connectWS();

        return () => {
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnect on unmount
                ws.current.close();
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
        };
    }, [currentUserId, selectedContact]);



    const handleInputChange = (e) => {
        setInput(e.target.value);

        // Send "typing" status to WebSocket
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: "typing",
                receiver_id: selectedContact.id,
                is_typing: e.target.value.length > 0
            }));

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing indicator after 2 seconds of inactivity
            if (e.target.value.length > 0) {
                typingTimeoutRef.current = setTimeout(() => {
                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                        ws.current.send(JSON.stringify({
                            type: "typing",
                            receiver_id: selectedContact.id,
                            is_typing: false
                        }));
                    }
                }, 2000);
            }
        }
    };

    const sendMessage = () => {
        if (ws.current && input.trim() && selectedContact) {
            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Send stop typing status
            ws.current.send(JSON.stringify({
                type: "typing",
                receiver_id: selectedContact.id,
                is_typing: false
            }));

            const payload = {
                receiver_id: selectedContact.id,
                message: input
            };
            ws.current.send(JSON.stringify(payload));

            setMessages((prev) => [...prev, {
                sender: 'Me',
                message: input,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'outgoing',
                status: 'sent' // Initial status
            }]);

            if (onMessageSent) {
                onMessageSent();
            }

            setInput('');

            // Simulate delivery after 1 second (in real app, this would come from backend)
            setTimeout(() => {
                setMessages((prev) => prev.map((msg, i) =>
                    i === prev.length - 1 ? { ...msg, status: 'delivered' } : msg
                ));
            }, 1000);
        }
    };

    if (!selectedContact) {
        return <div className="chat-container">No contact selected</div>;
    }

    return (
        <div className="chat-container">
            {/* Reconnection Toast */}
            {isReconnecting && (
                <div className="connection-toast">
                    Reconnecting...
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
                                src={`https://i.pravatar.cc/150?u=${selectedContact.username}`}
                                alt={selectedContact.username}
                            />
                            <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
                        </div>
                        <div className="user-details">
                            <h3>{selectedContact.username}</h3>
                            <p className={`user-status ${isTyping ? 'typing' : ''}`}>
                                {isTyping ? (
                                    <span className="typing-indicator-text">
                                        <span className="typing-dots">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </span>
                                    </span>
                                ) : (isOnline ? 'Online' : 'Last seen recently')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="icon-button"><Video size={24} /></button>
                    <button className="icon-button"><Phone size={24} /></button>
                </div>
            </header>

            {/* Message List */}
            <div className="message-list" ref={messageListRef}>
                {initializing ? (
                    <div className="loading-messages">
                        <div className="spinner"></div>
                        <p>Initializing chat...</p>
                    </div>
                ) : error ? (
                    <div className="no-messages" style={{ flexDirection: 'column', gap: '10px' }}>
                        <p style={{ color: '#ef4444' }}>{error}</p>
                        <button
                            onClick={onLogout}
                            className="send-button"
                            style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
                        >
                            Log Out & Reset
                        </button>
                    </div>
                ) : loadingMessages ? (
                    <div className="loading-messages">
                        <div className="spinner"></div>
                        <p>Loading messages...</p>
                    </div>
                ) : (
                    <>
                        <div className="date-divider">Today</div>

                        {messages.length === 0 ? (
                            <div className="no-messages">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`message-group ${msg.type}`}>
                                    {msg.type === 'incoming' && (
                                        <div className="message-avatar">
                                            <img
                                                src={`https://i.pravatar.cc/150?u=${selectedContact.username}`}
                                                alt="Sender"
                                                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                            />
                                        </div>
                                    )}

                                    <div className="message-content">
                                        <div className="message-bubble">
                                            {msg.message}
                                        </div>
                                        <div className="message-meta">
                                            <span>{msg.time}</span>
                                            {msg.type === 'outgoing' && (
                                                msg.status === 'delivered' ? (
                                                    <CheckCheck size={14} className="read-receipt delivered" />
                                                ) : (
                                                    <Check size={14} className="read-receipt sent" />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
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
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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

import React, { useState, useEffect, useCallback } from 'react';
import { Globe, MessageSquare, AtSign, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import './Maintenance.css';

const Maintenance = () => {
    // --- Game State ---
    const [score, setScore] = useState(0);
    const [bubbles, setBubbles] = useState([]);
    const [email, setEmail] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // --- Bubble Game Logic ---
    const spawnBubble = useCallback(() => {
        const id = Date.now();
        const size = Math.random() * 30 + 30; // 30-60px
        const left = Math.random() * 80 + 10; // 10-90% to prevent edge clipping
        const top = Math.random() * 60 + 20; // 20-80%
        const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#818cf8'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        setBubbles((prev) => [
            ...prev.slice(isExpanded ? -14 : -4), // Keep more bubbles if expanded
            { id, size, left, top, color },
        ]);
    }, [isExpanded]);

    useEffect(() => {
        const gameInterval = setInterval(spawnBubble, 1500);
        spawnBubble(); // Initial bubble
        return () => clearInterval(gameInterval);
    }, [spawnBubble]);

    const popBubble = (id) => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
        setScore((s) => s + 1);
    };

    const resetScore = () => setScore(0);

    const handleNotify = (e) => {
        e.preventDefault();
        if (email) {
            alert(`We'll notify ${email} when we're back!`);
            setEmail('');
        }
    };

    const toggleExpand = () => {
        if (isExpanded) {
            setIsClosing(true);
            setTimeout(() => {
                setIsExpanded(false);
                setIsClosing(false);
            }, 300); // Animation duration
        } else {
            setIsExpanded(true);
        }
    };

    return (
        <div className="maintenance-container">
            <div className="maintenance-content">

                {/* Header Section */}
                <header className="maintenance-header">
                    <div className="illustration-box">
                        {/* SVG Bot Icon */}
                        <svg
                            width="120"
                            height="120"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="bot-icon"
                        >
                            <rect x="3" y="11" width="18" height="10" rx="2" fill="#1e293b" stroke="#60a5fa" strokeWidth="2" />
                            <circle cx="12" cy="5" r="3" fill="#1e293b" stroke="#60a5fa" strokeWidth="2" />
                            <line x1="12" y1="8" x2="12" y2="11" stroke="#60a5fa" strokeWidth="2" />
                            <line x1="9" y1="16" x2="15" y2="16" stroke="#fbbf24" strokeWidth="2" />
                            <circle cx="9" cy="14" r="1" fill="#60a5fa" />
                            <circle cx="15" cy="14" r="1" fill="#60a5fa" />
                            <line x1="1" y1="14" x2="3" y2="14" stroke="#64748b" />
                            <line x1="21" y1="14" x2="23" y2="14" stroke="#64748b" />
                            <path d="M16 4L19 2" stroke="#64748b" />
                            <path d="M8 4L5 2" stroke="#64748b" />
                        </svg>
                    </div>

                    <h1 className="maintenance-title">
                        We're tidying up<br />the chat...
                    </h1>
                    <p className="maintenance-subtitle">
                        Scheduled maintenance in progress.<br />
                        We'll be back shortly!
                    </p>
                </header>

                {/* Main Grid Content */}
                <main className="maintenance-grid">

                    {/* Left Column: Game */}
                    <div className={`game-card ${isExpanded ? 'expanded' : ''} ${isClosing ? 'closing' : ''}`}>
                        <div className="game-header">
                            <span className="game-title">CHAT BUBBLE POP</span>
                            <div className="game-controls">
                                <span className="score-badge">Score: {score}</span>
                                <button
                                    onClick={resetScore}
                                    className="control-btn"
                                    title="Reset Score"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={toggleExpand}
                                    className="control-btn"
                                    title={isExpanded ? "Minimize" : "Maximize"}
                                >
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="game-area">
                            {bubbles.map((bubble) => (
                                <div
                                    key={bubble.id}
                                    className="game-bubble"
                                    onClick={() => popBubble(bubble.id)}
                                    style={{
                                        width: bubble.size,
                                        height: bubble.size,
                                        left: `${bubble.left}% `,
                                        top: `${bubble.top}% `,
                                        backgroundColor: bubble.color,
                                    }}
                                >
                                    <svg
                                        width="60%"
                                        height="60%"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bubble-pop-hint">Tap bubbles to pass the time!</div>

                    {/* Right Column: Interactions */}
                    <div className="interactions-column">
                        <form className="notify-section" onSubmit={handleNotify}>
                            <input
                                type="email"
                                className="notify-input"
                                placeholder="Your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="notify-btn">
                                Notify Me
                            </button>
                        </form>
                    </div>
                </main>

                {/* Footer */}
                <footer className="maintenance-footer">
                    <div className="footer-links">
                        <Globe size={20} className="footer-icon" />
                        <MessageSquare size={20} className="footer-icon" />
                        <AtSign size={20} className="footer-icon" />
                    </div>
                    <div className="company-name">TEXTER MESSAGING INC.</div>
                </footer>
            </div>
        </div>
    );
};

export default Maintenance;